export class SiliconCloudAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('SILICONFLOW_API_KEY is not defined');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.siliconflow.com/v1';
  }

  async chat(messages: { role: string; content: string }[]) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('[SILICON_CLOUD_API_ERROR]', error);
      throw error;
    }
  }
}

export const siliconCloudAPI = new SiliconCloudAPI(); 