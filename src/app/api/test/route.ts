import { NextResponse } from 'next/server';
import { siliconCloudAPI, fallbackAPI } from '@/lib/silicon-cloud';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // 简单的测试消息
    const testMessages = [
      { role: 'user', content: 'Hello, this is a test message.' }
    ];

    // 首先尝试主 API
    try {
      const response = await siliconCloudAPI.chat(testMessages);
      const data = await response.json();
      return NextResponse.json({ 
        success: true, 
        api: 'primary',
        data
      });
    } catch (primaryError) {
      console.error('Primary API failed:', primaryError);
      
      // 如果主 API 失败，尝试备用 API
      try {
        const response = await fallbackAPI.chat(testMessages);
        const data = await response.json();
        return NextResponse.json({ 
          success: true, 
          api: 'fallback',
          data
        });
      } catch (fallbackError) {
        console.error('Fallback API failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('API test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 