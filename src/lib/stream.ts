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
        if (line === 'data: [DONE]') continue;

        try {
          const parsed = JSON.parse(line.slice(6));
          if (!parsed.choices?.[0]?.delta) {
            console.error('Invalid chunk format:', line);
            continue;
          }

          const content = parsed.choices[0].delta.content || '';
          
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
          console.error('Error parsing chunk:', e, 'Raw data:', line);
          continue;
        }
      }
    }

    if (accumulatedContent) {
      await updateMessage(messageId, {
        content: accumulatedContent,
        reasoning_content: accumulatedReasoning,
        status: 'completed',
      });
    } else {
      throw new Error('No content received from the API');
    }
  } catch (error) {
    console.error('Stream processing error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isServerBusy = errorMessage.includes('503') || errorMessage.includes('busy');
    
    await updateMessage(messageId, {
      status: 'error',
      content: isServerBusy ? '服务器繁忙，请稍后重试' : (accumulatedContent || 'Error: Failed to generate response'),
      reasoning_content: accumulatedReasoning + (isServerBusy ? '' : '\n\nError: ' + errorMessage),
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