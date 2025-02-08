import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessage, getConversation, getConversationMessages, updateMessage } from '@/lib/db';
import { siliconCloudAPI, fallbackAPI } from '@/lib/silicon-cloud';

// 使用 Serverless Function
export const runtime = 'edge';

function streamResponse(readable: ReadableStream) {
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: Request) {
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

    // 创建一个 TransformStream 用于处理流式响应
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // 异步处理消息
    (async () => {
      try {
        // 更新消息状态
        await updateMessage(messageId, { status: 'processing' });

        // 尝试使用主 API
        try {
          const response = await siliconCloudAPI.chat(messages);
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

          let content = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              if (line === 'data: [DONE]') continue;

              try {
                const data = JSON.parse(line.slice(6));
                const delta = data.choices?.[0]?.delta?.content || '';
                content += delta;

                // 发送更新到客户端
                await writer.write(encoder.encode(`data: ${JSON.stringify({
                  type: 'update',
                  content: delta,
                  status: 'processing'
                })}\n\n`));

                // 更新消息内容
                await updateMessage(messageId, {
                  content,
                  status: 'processing',
                });
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }

          // 发送完成消息
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            content,
            status: 'completed'
          })}\n\n`));

          await updateMessage(messageId, {
            content,
            status: 'completed',
          });

          reader.releaseLock();
        } catch (error) {
          console.error('[PRIMARY_API_ERROR]', error);

          // 如果主 API 失败，尝试备用 API
          try {
            const response = await fallbackAPI.chat(messages);
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            let content = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) continue;
                if (line === 'data: [DONE]') continue;

                try {
                  const data = JSON.parse(line.slice(6));
                  const delta = data.choices?.[0]?.delta?.content || '';
                  content += delta;

                  // 发送更新到客户端
                  await writer.write(encoder.encode(`data: ${JSON.stringify({
                    type: 'update',
                    content: delta,
                    status: 'processing'
                  })}\n\n`));

                  // 更新消息内容
                  await updateMessage(messageId, {
                    content,
                    status: 'processing',
                  });
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }

            // 发送完成消息
            await writer.write(encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              content,
              status: 'completed'
            })}\n\n`));

            await updateMessage(messageId, {
              content,
              status: 'completed',
            });

            reader.releaseLock();
          } catch (fallbackError) {
            console.error('[FALLBACK_API_ERROR]', fallbackError);
            throw fallbackError;
          }
        }
      } catch (error) {
        console.error('[PROCESS_MESSAGE_ERROR]', error);
        
        // 发送错误消息
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        })}\n\n`));

        await updateMessage(messageId, {
          status: 'error',
          content: '服务器繁忙，请稍后重试',
        });
      } finally {
        await writer.close();
      }
    })().catch(console.error);

    return streamResponse(stream.readable);
  } catch (error) {
    console.error('[CHAT_PROCESS]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    );
  }
} 