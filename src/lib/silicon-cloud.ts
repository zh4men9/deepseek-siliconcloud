export class SiliconCloudAPI {
  private apiKey: string;
  private baseUrl: string;
  private readonly MODEL_NAME = 'deepseek-ai/DeepSeek-R1';

  constructor(baseUrl?: string) {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('SILICONFLOW_API_KEY is not defined');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.siliconflow.cn/v1';
  }

  async testConnection() {
    try {
      // 发送一条简单的中文消息测试
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL_NAME,
          messages: [{ role: 'user', content: '你好' }],
          temperature: 0.7,
          max_tokens: 100,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `API test failed with status ${response.status}: ${
            errorData ? JSON.stringify(errorData) : 'Unknown error'
          }`
        );
      }

      // 获取并返回实际的响应内容
      const data = await response.json();
      return {
        success: true,
        response: data.choices[0]?.message?.content || '',
      };
    } catch (error) {
      console.error('[SILICON_CLOUD_API_TEST_ERROR]', error);
      throw error;
    }
  }

  async chat(messages: { role: string; content: string }[]) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL_NAME,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `API request failed with status ${response.status}: ${
            errorData ? JSON.stringify(errorData) : 'Unknown error'
          }`
        );
      }

      return response;
    } catch (error) {
      console.error('[SILICON_CLOUD_API_ERROR]', error);
      throw error;
    }
  }
}

// 创建一个带有备用 URL 的实例
export const siliconCloudAPI = new SiliconCloudAPI();

// 如果主 URL 失败，可以尝试使用备用 URL
export const fallbackAPI = new SiliconCloudAPI('https://api.siliconflow.com/v1'); 