import { Schema, model, Types } from 'mongoose';
import type { PaymentEventType } from '@barbellix/shared';

const PAYMENT_EVENT_TYPES: PaymentEventType[] = [
  'checkout_completed',
  'subscription_renewed',
  'subscription_cancelled',
  'payment_failed',
  'marked_paid',
];

export interface PaymentEventDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  type: PaymentEventType;
  amountCents?: number;
  currency?: string;
  planName?: string;
  occurredAt: Date;
}

const paymentEventSchema = new Schema<PaymentEventDocument>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: PAYMENT_EVENT_TYPES, required: true },
  amountCents: { type: Number },
  currency: { type: String },
  planName: { type: String },
  occurredAt: { type: Date, required: true, default: Date.now },
});

export const PaymentEventModel = model<PaymentEventDocument>('PaymentEvent', paymentEventSchema);
