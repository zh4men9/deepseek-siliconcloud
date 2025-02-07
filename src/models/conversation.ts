import mongoose from 'mongoose';
import { IUser } from './user';

export interface IConversation {
  _id: mongoose.Types.ObjectId;
  userId: IUser['_id'];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new mongoose.Schema<IConversation>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema); 