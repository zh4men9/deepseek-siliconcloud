export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: number;
  updatedAt: number;
} 