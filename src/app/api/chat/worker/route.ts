import { NextResponse } from 'next/server';
import { messageQueue } from '@/lib/queue';
import { siliconCloudAPI, fallbackAPI } from '@/lib/silicon-cloud';
import { updateMessage } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5分钟超时

/* eslint-disable @typescript-eslint/no-explicit-any */
async function processMessage(queueItem: any) {
  try {
    // 更新消息状态为处理中
    await messageQueue.updateStatus(queueItem.id, { status: 'processing' });
    await updateMessage(queueItem.messageId, { status: 'processing' });

    // 尝试使用主 API
    try {
      const response = await siliconCloudAPI.chat(queueItem.messages);
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

            // 定期更新消息内容
            await updateMessage(queueItem.messageId, {
              content,
              status: 'processing',
            });
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }

      // 更新最终状态
      await messageQueue.updateStatus(queueItem.id, {
        status: 'completed',
        result: content,
      });
      await updateMessage(queueItem.messageId, {
        content,
        status: 'completed',
      });

      reader.releaseLock();
    } catch (error) {
      console.error('[PRIMARY_API_ERROR]', error);

      // 如果主 API 失败，尝试备用 API
      try {
        const response = await fallbackAPI.chat(queueItem.messages);
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

              // 定期更新消息内容
              await updateMessage(queueItem.messageId, {
                content,
                status: 'processing',
              });
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }

        // 更新最终状态
        await messageQueue.updateStatus(queueItem.id, {
          status: 'completed',
          result: content,
        });
        await updateMessage(queueItem.messageId, {
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
    await messageQueue.updateStatus(queueItem.id, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    await updateMessage(queueItem.messageId, {
      status: 'error',
      content: '服务器繁忙，请稍后重试',
    });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const queueItem = await messageQueue.dequeue();
    if (!queueItem) {
      return NextResponse.json({ message: 'No messages in queue' });
    }

    // 开始处理消息
    processMessage(queueItem).catch(console.error);

    return NextResponse.json({ message: 'Processing started' });
  } catch (error) {
    console.error('[WORKER_ERROR]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    );
  }
} 