import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Message } from '@/models/message';
import { Conversation } from '@/models/conversation';
import connectDB from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content, conversationId } = await req.json();
    if (!content) {
      return new NextResponse('Content is required', { status: 400 });
    }

    await connectDB();

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.userId.toString() !== session.user.id) {
        return new NextResponse('Conversation not found', { status: 404 });
      }
    } else {
      conversation = await Conversation.create({
        userId: session.user.id,
        title: content.slice(0, 100),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      content,
      role: 'user',
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