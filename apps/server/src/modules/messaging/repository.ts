import type { HydratedDocument } from 'mongoose';
import type { Message } from '@fitpulse/shared';
import { MessageModel, type MessageDocument } from '../../db/models/Message.js';
import { UserModel } from '../../db/models/User.js';

export function toDomainMessage(doc: HydratedDocument<MessageDocument>): Message {
  return {
    id: doc._id.toString(),
    senderId: doc.senderId.toString(),
    recipientId: doc.recipientId.toString(),
    text: doc.text,
    createdAt: doc.createdAt.toISOString(),
    read: doc.read,
  };
}

export async function findThread(userId: string, otherUserId: string, limit: number) {
  return MessageModel.find({
    $or: [
      { senderId: userId, recipientId: otherUserId },
      { senderId: otherUserId, recipientId: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function create(input: { tenantId: string; senderId: string; recipientId: string; text: string }) {
  return MessageModel.create(input);
}

export async function markRead(id: string, recipientId: string) {
  return MessageModel.findOneAndUpdate({ _id: id, recipientId }, { $set: { read: true } }, { new: true });
}

export async function findUserInTenant(userId: string, tenantId: string) {
  return UserModel.findOne({ _id: userId, tenantId });
}
