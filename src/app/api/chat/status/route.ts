import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { messageQueue } from '@/lib/queue';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session.userId;
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const queueId = url.searchParams.get('queueId');
    if (!queueId) {
      return new NextResponse('Queue ID is required', { status: 400 });
    }

    const status = await messageQueue.getStatus(queueId);
    if (!status) {
      return new NextResponse('Queue item not found', { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('[CHAT_STATUS]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    );
  }
} 