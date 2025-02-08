import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessage, getConversation, getConversationMessages, updateMessage } from '@/lib/db';
import { messageQueue } from '@/lib/queue';

// 使用 Serverless Function
export const runtime = 'nodejs';

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

    // 将消息加入队列
    const queueId = await messageQueue.enqueue(messageId, messages);

    // 返回队列 ID 和初始状态
    return NextResponse.json({
      queueId,
      status: 'pending',
      message: '消息已加入处理队列',
    });
  } catch (error) {
    console.error('[CHAT_PROCESS]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    );
  }
} 