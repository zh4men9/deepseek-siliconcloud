type ChatMessage = {
  role: string;
  content: string;
};

type ChatRequestBody = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  reasoning?: boolean;
};

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
    this.baseUrl = baseUrl || 'https://api.siliconflow.com/v1';
  }

  private async makeRequest(endpoint: string, body: ChatRequestBody): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        reasoning: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('[SILICON_CLOUD_API_ERROR]', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint,
      });
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorData ? JSON.stringify(errorData) : 'Unknown error'
        }`
      );
    }

    return response;
  }

  async testConnection(): Promise<Response> {
    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.MODEL_NAME,
        messages: [{ role: 'user', content: '你好' }],
        temperature: 0.7,
        max_tokens: 100,
        stream: true,
      });

      return response;
    } catch (error) {
      console.error('[SILICON_CLOUD_API_TEST_ERROR]', error);
      throw error;
    }
  }

  async chat(messages: ChatMessage[]): Promise<Response> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('Messages array is empty or undefined');
      }

      return await this.makeRequest('/chat/completions', {
        model: this.MODEL_NAME,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    } catch (error) {
      console.error('[SILICON_CLOUD_API_ERROR]', error);
      if (error instanceof Error && error.message.includes('503')) {
        throw new Error('服务器繁忙，请稍后重试');
      }
      throw error;
    }
  }
}

// 创建一个主实例，使用全球负载均衡的域名
export const siliconCloudAPI = new SiliconCloudAPI('https://api.siliconflow.com/v1');

// 如果主域名失败，可以尝试使用备用域名
export const fallbackAPI = new SiliconCloudAPI('https://api.siliconflow.cn/v1'); 