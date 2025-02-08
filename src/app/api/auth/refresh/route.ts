import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'edge';

export async function POST() {
  try {
    const session = await auth();
    if (!session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 如果能获取到 session，说明会话是有效的
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AUTH_REFRESH]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Error',
      { status: 500 }
    );
  }
} 