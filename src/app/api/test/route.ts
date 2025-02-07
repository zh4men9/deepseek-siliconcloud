import { NextResponse } from 'next/server';
import { siliconCloudAPI, fallbackAPI } from '@/lib/silicon-cloud';

export const runtime = 'edge';

export async function GET() {
  try {
    // 首先尝试主 API
    try {
      const result = await siliconCloudAPI.testConnection();
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully connected to SiliconCloud API',
        url: 'api.siliconflow.cn',
        modelResponse: result.response
      });
    } catch (error) {
      console.error('Primary API failed, trying fallback...', error);
      
      // 如果主 API 失败，尝试备用 API
      const result = await fallbackAPI.testConnection();
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully connected to SiliconCloud API (fallback)',
        url: 'api.siliconflow.com',
        modelResponse: result.response
      });
    }
  } catch (error) {
    console.error('API test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 