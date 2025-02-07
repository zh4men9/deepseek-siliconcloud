import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessage, getConversation, getConversationMessages } from '@/lib/db';
import { siliconCloudAPI } from '@/lib/silicon-cloud';
import { processStream } from '@/lib/stream';

export const runtime = 'edge';

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

    const response = await siliconCloudAPI.chat(messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await processStream(response, messageId, (content) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          });
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
    console.error('[CHAT_PROCESS]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 