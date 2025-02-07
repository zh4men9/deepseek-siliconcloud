import { updateMessage } from '@/lib/db';

export async function processStream(
  response: Response,
  messageId: string,
  onUpdate: (content: string) => void
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }

  let accumulatedContent = '';
  let accumulatedReasoning = '';
  let isReasoning = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          
          if (content.includes('[REASONING]')) {
            isReasoning = true;
            continue;
          }
          
          if (content.includes('[/REASONING]')) {
            isReasoning = false;
            continue;
          }

          if (isReasoning) {
            accumulatedReasoning += content;
          } else {
            accumulatedContent += content;
            onUpdate(accumulatedContent);
          }

          await updateMessage(messageId, {
            content: accumulatedContent,
            reasoning_content: accumulatedReasoning,
            status: 'processing',
          });
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    }

    await updateMessage(messageId, {
      status: 'completed',
    });
  } catch (error) {
    console.error('Stream processing error:', error);
    await updateMessage(messageId, {
      status: 'error',
    });
    throw error;
  } finally {
    reader.releaseLock();
  }

  return {
    content: accumulatedContent,
    reasoning_content: accumulatedReasoning,
  };
} 