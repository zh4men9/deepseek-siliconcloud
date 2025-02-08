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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SiliconCloudAPI {
  private apiKey: string;
  private baseUrl: string;
  private readonly MODEL_NAME = 'deepseek-ai/DeepSeek-R1';
  private maxRetries: number;
  private initialRetryDelay: number;

  constructor(baseUrl?: string, maxRetries = 3, initialRetryDelay = 1000) {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('SILICONFLOW_API_KEY is not defined');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.siliconflow.com/v1';
    this.maxRetries = maxRetries;
    this.initialRetryDelay = initialRetryDelay;
  }

  private async makeRequest(endpoint: string, body: ChatRequestBody, retryCount = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 增加到30秒超时

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
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[SILICON_CLOUD_API_ERROR]', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          endpoint,
          retryCount,
        });

        // 如果是 503 错误或超时且还有重试次数，则进行重试
        if ((response.status === 503 || response.status === 408) && retryCount < this.maxRetries) {
          const delay = this.initialRetryDelay * Math.pow(2, retryCount);
          console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
          await sleep(delay);
          return this.makeRequest(endpoint, body, retryCount + 1);
        }

        throw new Error(
          `API request failed with status ${response.status}: ${
            errorData ? JSON.stringify(errorData) : response.statusText
          }`
        );
      }

      return response;
    } catch (error) {
      console.error('[SILICON_CLOUD_API_REQUEST_ERROR]', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        retryCount,
      });

      if (error instanceof Error && 
          (error.message.includes('503') || 
           error.message.includes('busy') || 
           error.name === 'AbortError' || 
           error.message.includes('timeout')) && 
          retryCount < this.maxRetries) {
        const delay = this.initialRetryDelay * Math.pow(2, retryCount);
        console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        await sleep(delay);
        return this.makeRequest(endpoint, body, retryCount + 1);
      }
      throw error;
    }
  }

  async testConnection(): Promise<Response> {
    return this.chat([{ role: 'user', content: '你好' }]);
  }

  async chat(messages: ChatMessage[]): Promise<Response> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('Messages array is empty or undefined');
      }

      const response = await this.makeRequest('/chat/completions', {
        model: this.MODEL_NAME,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false, // 测试时不使用流式响应
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      return response;
    } catch (error) {
      console.error('[SILICON_CLOUD_API_ERROR]', error);
      if (error instanceof Error && 
          (error.message.includes('503') || error.message.includes('busy'))) {
        throw new Error('服务器繁忙，请稍后重试');
      }
      throw error;
    }
  }
}

// 创建一个主实例，使用全球负载均衡的域名
export const siliconCloudAPI = new SiliconCloudAPI('https://api.siliconflow.com/v1', 3, 1000);

// 如果主域名失败，可以尝试使用备用域名
export const fallbackAPI = new SiliconCloudAPI('https://api.siliconflow.cn/v1', 3, 1000);

// 默认导出主 API 实例
export default siliconCloudAPI; 