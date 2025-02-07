import { kv } from '@vercel/kv';
import { Message, Conversation } from './types';

const PREFIXES = {
  USER: 'user:',
  CONVERSATION: 'conversation:',
  MESSAGE: 'message:',
  USER_CONVERSATIONS: 'user-conversations:',
  CONVERSATION_MESSAGES: 'conversation-messages:',
} as const;

export async function createMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2)}`;
  
  const newMessage: Message = {
    ...message,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await kv.set(`${PREFIXES.MESSAGE}${id}`, newMessage);
  await kv.lpush(`${PREFIXES.CONVERSATION_MESSAGES}${message.conversationId}`, id);

  return newMessage;
}

export async function getMessage(id: string): Promise<Message | null> {
  return kv.get(`${PREFIXES.MESSAGE}${id}`);
}

export async function updateMessage(id: string, update: Partial<Message>) {
  const message = await getMessage(id);
  if (!message) return null;

  const updatedMessage: Message = {
    ...message,
    ...update,
    updatedAt: Date.now(),
  };

  await kv.set(`${PREFIXES.MESSAGE}${id}`, updatedMessage);
  return updatedMessage;
}

export async function createConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2)}`;
  
  const newConversation: Conversation = {
    ...conversation,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await kv.set(`${PREFIXES.CONVERSATION}${id}`, newConversation);
  await kv.lpush(`${PREFIXES.USER_CONVERSATIONS}${conversation.userId}`, id);

  return newConversation;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return kv.get(`${PREFIXES.CONVERSATION}${id}`);
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const messageIds = await kv.lrange(`${PREFIXES.CONVERSATION_MESSAGES}${conversationId}`, 0, -1);
  if (!messageIds.length) return [];

  const messages = await Promise.all(
    messageIds.map(id => getMessage(id as string))
  );

  return messages.filter((msg): msg is Message => msg !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const conversationIds = await kv.lrange(`${PREFIXES.USER_CONVERSATIONS}${userId}`, 0, -1);
  if (!conversationIds.length) return [];

  const conversations = await Promise.all(
    conversationIds.map(id => getConversation(id as string))
  );

  return conversations.filter((conv): conv is Conversation => conv !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
} 