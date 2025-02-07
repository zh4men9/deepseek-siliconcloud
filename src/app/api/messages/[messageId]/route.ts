import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Message } from '@/models/message';
import { Conversation } from '@/models/conversation';
import connectDB from '@/lib/db';

interface RouteParams {
  params: {
    messageId: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const message = await Message.findById(params.messageId).populate('conversationId');
    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    const conversation = message.conversationId as any;
    if (conversation.userId.toString() !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('[MESSAGE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content, status, reasoning_content } = await req.json();

    await connectDB();

    const message = await Message.findById(params.messageId).populate('conversationId');
    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    const conversation = message.conversationId as any;
    if (conversation.userId.toString() !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      params.messageId,
      { content, status, reasoning_content },
      { new: true }
    );

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('[MESSAGE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 