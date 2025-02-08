import { NextResponse } from 'next/server';
import { siliconCloudAPI, fallbackAPI } from '@/lib/silicon-cloud';

export const runtime = 'edge';

export async function GET() {
  try {
    // 首先尝试主 API
    try {
      const response = await siliconCloudAPI.testConnection();
      
      // 创建一个新的 ReadableStream 来处理流式响应
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No reader available');
            }

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
                  const content = data.choices[0]?.delta?.content || '';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('Primary API failed, trying fallback...', error);
      
      // 如果主 API 失败，尝试备用 API
      const response = await fallbackAPI.testConnection();
      
      // 创建一个新的 ReadableStream 来处理流式响应
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No reader available');
            }

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
                  const content = data.choices[0]?.delta?.content || '';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (error) {
    console.error('API test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 