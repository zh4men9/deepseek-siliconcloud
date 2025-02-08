import { kv } from '@vercel/kv';
import { Message } from './types';

interface QueueItem {
  id: string;
  messageId: string;
  messages: Message[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export class MessageQueue {
  private readonly prefix = 'queue:';

  async enqueue(messageId: string, messages: Message[]): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: QueueItem = {
      id,
      messageId,
      messages,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await kv.set(`${this.prefix}${id}`, item);
    await kv.lpush('message-queue', id);

    return id;
  }

  async getStatus(id: string): Promise<QueueItem | null> {
    return kv.get(`${this.prefix}${id}`);
  }

  async updateStatus(id: string, update: Partial<QueueItem>): Promise<void> {
    const item = await this.getStatus(id);
    if (!item) return;

    const updatedItem: QueueItem = {
      ...item,
      ...update,
      updatedAt: Date.now(),
    };

    await kv.set(`${this.prefix}${id}`, updatedItem);
  }

  async dequeue(): Promise<QueueItem | null> {
    const id = await kv.rpop('message-queue');
    if (!id) return null;

    const item = await this.getStatus(id as string);
    if (!item) return null;

    return item;
  }

  async clear(): Promise<void> {
    const ids = await kv.lrange('message-queue', 0, -1);
    if (!ids.length) return;

    await Promise.all([
      ...ids.map(id => kv.del(`${this.prefix}${id}`)),
      kv.del('message-queue'),
    ]);
  }
}

export const messageQueue = new MessageQueue(); 