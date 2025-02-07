import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessage, getConversation, updateMessage } from '@/lib/db';

export const runtime = 'edge';

type RouteParams = Promise<{ messageId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { messageId } = await params;
    const message = await getMessage(messageId);
    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    const conversation = await getConversation(message.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('[MESSAGE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { content, status, reasoning_content } = await request.json();
    const { messageId } = await params;

    const message = await getMessage(messageId);
    if (!message) {
      return new NextResponse('Message not found', { status: 404 });
    }

    const conversation = await getConversation(message.conversationId);
    if (!conversation || conversation.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const updatedMessage = await updateMessage(messageId, {
      content,
      status,
      reasoning_content,
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('[MESSAGE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 