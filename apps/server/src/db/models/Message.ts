import { Schema, model, Types } from 'mongoose';

export interface MessageDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  text: string;
  createdAt: Date;
  read: boolean;
}

const messageSchema = new Schema<MessageDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, required: true, default: false },
});

messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export const MessageModel = model<MessageDocument>('Message', messageSchema);
