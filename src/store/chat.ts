import { create } from 'zustand';
import { Message, Conversation } from '@/lib/types';

interface ChatState {
  messages: Message[];
  currentConversation: Conversation | null;
  isProcessing: boolean;
  error: string | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, update: Partial<Message>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  pollMessageStatus: (messageId: string, queueId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentConversation: null,
  isProcessing: false,
  error: null,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (messageId, update) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...update } : msg
      ),
    })),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),

  pollMessageStatus: async (messageId: string, queueId: string) => {
    const state = get();
    let retries = 0;
    const maxRetries = 60; // 最多轮询60次
    const interval = 1000; // 每秒轮询一次
    let authRetries = 0;
    const maxAuthRetries = 3; // 最多重试认证3次

    const poll = async () => {
      try {
        // 添加时间戳防止缓存
        const timestamp = Date.now();
        const response = await fetch(`/api/chat/status?queueId=${queueId}&_=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include' // 确保发送认证信息
        });
        
        if (response.status === 401 && authRetries < maxAuthRetries) {
          console.log('认证错误，正在重试...', authRetries + 1);
          authRetries++;
          
          // 尝试刷新会话
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include'
            });
            
            if (refreshResponse.ok) {
              console.log('会话已刷新');
              return false; // 继续轮询
            }
          } catch (refreshError) {
            console.error('刷新会话失败:', refreshError);
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          return false;
        }

        if (!response.ok) {
          if (response.status === 401) {
            state.updateMessage(messageId, {
              content: '会话已过期，请刷新页面重新登录',
              status: 'error',
            });
            return true;
          }
          throw new Error('获取消息状态失败');
        }

        authRetries = 0; // 重置认证重试计数

        const data = await response.json();
        if (data.status === 'completed') {
          state.updateMessage(messageId, {
            content: data.result,
            status: 'completed',
          });
          return true;
        } else if (data.status === 'error') {
          state.updateMessage(messageId, {
            content: data.error || '服务器繁忙，请稍后重试',
            status: 'error',
          });
          return true;
        } else if (retries >= maxRetries) {
          state.updateMessage(messageId, {
            content: '响应超时，请重试',
            status: 'error',
          });
          return true;
        }

        retries++;
        return false;
      } catch (error) {
        console.error('轮询消息状态出错:', error);
        
        if (error instanceof Error && error.name === 'TypeError') {
          if (retries < maxRetries) {
            retries++;
            return false;
          }
        }
        
        state.updateMessage(messageId, {
          content: '获取消息状态失败，请刷新页面重试',
          status: 'error',
        });
        return true;
      }
    };

    while (!(await poll())) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  },

  sendMessage: async (content: string) => {
    const state = get();
    const { currentConversation } = state;

    try {
      state.setIsProcessing(true);
      state.setError(null);

      // 发送消息
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include', // 确保发送认证信息
        body: JSON.stringify({
          content,
          conversationId: currentConversation?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      state.addMessage(data.message);

      if (!currentConversation) {
        state.setCurrentConversation(data.conversation);
      }

      // 处理消息
      const processResponse = await fetch('/api/chat/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include', // 确保发送认证信息
        body: JSON.stringify({
          messageId: data.message.id,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process message');
      }

      const processData = await processResponse.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        conversationId: currentConversation?.id || data.conversation.id,
        role: 'assistant',
        content: '',
        status: 'processing',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.addMessage(assistantMessage);

      // 开始轮询消息状态
      await state.pollMessageStatus(assistantMessage.id, processData.queueId);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error sending message:', error);
    } finally {
      state.setIsProcessing(false);
    }
  },
})); 