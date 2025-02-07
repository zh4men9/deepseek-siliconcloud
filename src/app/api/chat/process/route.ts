import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Message } from '@/models/message';
import { Conversation } from '@/models/conversation';
import { siliconCloudAPI } from '@/lib/silicon-cloud';
import { processStream } from '@/lib/stream';
import connectDB from '@/lib/db';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { messageId } = await req.json();
    if (!messageId) {
      return new NextResponse('Message ID is required', { status: 400 });
    }

    await connectDB();

    const message = await Message.findById(messageId).populate({
      path: 'conversationId',
      populate: {
        path: 'messages',
        options: { sort: { createdAt: 1 } },
      },
    });

    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    const conversation = message.conversationId as any;
    if (conversation.userId.toString() !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const messages = conversation.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await siliconCloudAPI.chat(messages);

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