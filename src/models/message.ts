import mongoose from 'mongoose';
import { IConversation } from './conversation';

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  conversationId: IConversation['_id'];
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    reasoning_content: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'error'],
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema); 