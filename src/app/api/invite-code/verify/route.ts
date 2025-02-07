import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    // 检查邀请码是否有效
    const validCodes = process.env.INVITE_CODES?.split(',') || [];
    if (!validCodes.includes(code)) {
      return new NextResponse('Invalid invite code', { status: 400 });
    }

    // 检查邀请码是否已被使用
    const isUsed = await kv.get(`invite-code:${code}`);
    if (isUsed) {
      return new NextResponse('Invite code already used', { status: 400 });
    }

    // 标记邀请码为已使用
    await kv.set(`invite-code:${code}`, true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INVITE_CODE_VERIFY]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 