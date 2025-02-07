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

  sendMessage: async (content: string) => {
    const state = get();
    const { currentConversation } = state;

    try {
      state.setIsProcessing(true);
      state.setError(null);

      // 发送消息
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: data.message.id,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process message');
      }

      const reader = processResponse.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

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

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));
              state.updateMessage(assistantMessage.id, {
                content: data.content,
              });
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      state.updateMessage(assistantMessage.id, {
        status: 'completed',
      });
    } catch (error) {
      state.setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error sending message:', error);
    } finally {
      state.setIsProcessing(false);
    }
  },
})); 