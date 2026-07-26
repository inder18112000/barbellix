import { Schema, model, Types } from 'mongoose';

export interface DeviceTokenDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tenantId: Types.ObjectId;
  expoPushToken: string;
  platform: 'ios' | 'android' | 'web';
  lastSeenAt: Date;
}

const deviceTokenSchema = new Schema<DeviceTokenDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  expoPushToken: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  lastSeenAt: { type: Date, required: true, default: Date.now },
});

export const DeviceTokenModel = model<DeviceTokenDocument>('DeviceToken', deviceTokenSchema);
