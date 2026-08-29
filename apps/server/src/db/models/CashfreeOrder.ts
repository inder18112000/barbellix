import { Schema, model, Types } from 'mongoose';

export type CashfreeOrderStatus = 'created' | 'paid' | 'failed' | 'cancelled';

/** Tracks every online-checkout order this server has created with Cashfree, so the webhook
 * handler can atomically guard against duplicate delivery (gateways retry on timeout/failure) -
 * see billing/service.ts's handleCashfreeWebhook(). */
export interface CashfreeOrderDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  planId?: Types.ObjectId;
  cashfreeOrderId: string;
  paymentSessionId?: string;
  amountCents: number;
  currency: string;
  status: CashfreeOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const cashfreeOrderSchema = new Schema<CashfreeOrderDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
    cashfreeOrderId: { type: String, required: true, unique: true },
    paymentSessionId: { type: String },
    amountCents: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ['created', 'paid', 'failed', 'cancelled'], required: true, default: 'created' },
  },
  { timestamps: true },
);

export const CashfreeOrderModel = model<CashfreeOrderDocument>('CashfreeOrder', cashfreeOrderSchema);
