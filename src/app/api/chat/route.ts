import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createMessage, createConversation, getConversation } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content, conversationId } = await request.json();
    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    let conversation;
    if (conversationId) {
      conversation = await getConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return new NextResponse('Conversation not found', { status: 404 });
      }
    } else {
      conversation = await createConversation({
        userId,
        title: content.slice(0, 100),
      });
    }

    const message = await createMessage({
      conversationId: conversation.id,
      content,
      role: 'user',
      status: 'pending',
    });

    return NextResponse.json({
      message,
      conversation,
    });
  } catch (error) {
    console.error('[CHAT_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 