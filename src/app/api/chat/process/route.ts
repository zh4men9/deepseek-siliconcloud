import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessage, getConversation, getConversationMessages, updateMessage } from '@/lib/db';
import { siliconCloudAPI, fallbackAPI } from '@/lib/silicon-cloud';
import { processStream } from '@/lib/stream';

export const runtime = 'edge';
export const maxDuration = 60; // 设置最大执行时间为 60 秒

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 58000); // 58秒后中断

  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { messageId } = await req.json();
    if (!messageId) {
      return new NextResponse('Message ID is required', { status: 400 });
    }

    const message = await getMessage(messageId);
    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    const conversation = await getConversation(message.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const messages = await getConversationMessages(message.conversationId);
    if (!messages || messages.length === 0) {
      await updateMessage(messageId, {
        status: 'error',
        content: 'Error: No messages found in conversation',
      });
      return new NextResponse('No messages found in conversation', { status: 400 });
    }

    const chatMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    let response;
    try {
      // 首先尝试主 API
      response = await siliconCloudAPI.chat(chatMessages);
    } catch (error) {
      console.error('[PRIMARY_API_ERROR]', error);
      try {
        // 如果主 API 失败，尝试备用 API
        console.log('Primary API failed, trying fallback API...');
        response = await fallbackAPI.chat(chatMessages);
      } catch (fallbackError) {
        console.error('[FALLBACK_API_ERROR]', fallbackError);
        // 如果两个 API 都失败了，更新消息状态并抛出错误
        await updateMessage(messageId, {
          status: 'error',
          content: '服务器繁忙，请稍后重试',
        });
        throw fallbackError;
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let lastActivity = Date.now();
          const activityTimeout = setInterval(() => {
            if (Date.now() - lastActivity > 30000) { // 30秒无活动则关闭
              clearInterval(activityTimeout);
              controller.close();
            }
          }, 5000);

          await processStream(response, messageId, (content) => {
            lastActivity = Date.now();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          });

          clearInterval(activityTimeout);
          controller.close();
        } catch (error) {
          console.error('[STREAM_ERROR]', error);
          if (error instanceof Error && 
              (error.name === 'AbortError' || 
               error.message.includes('timeout') || 
               error.message.includes('busy'))) {
            await updateMessage(messageId, {
              status: 'error',
              content: '响应超时，请重试',
            });
          }
          controller.error(error);
        }
      },
    });

    clearTimeout(timeout);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('[CHAT_PROCESS]', error);
    
    // 处理超时错误
    if (error instanceof Error && 
        (error.name === 'AbortError' || 
         error.message.includes('timeout') || 
         error.message.includes('busy'))) {
      return new NextResponse('响应超时，请重试', { status: 408 });
    }
    
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    );
  }
} 