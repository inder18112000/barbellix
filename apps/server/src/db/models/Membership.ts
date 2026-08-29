import { Schema, model, Types } from 'mongoose';
import type { MembershipStatus, PaymentStatus, PaymentMethod } from '@barbellix/shared';

const MEMBERSHIP_STATUSES: MembershipStatus[] = ['active', 'expired', 'cancelled', 'paused', 'incomplete'];
const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'due', 'overdue', 'comp'];
const PAYMENT_METHODS: PaymentMethod[] = ['online', 'cash'];

export interface MembershipDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tenantId: Types.ObjectId;
  planId?: Types.ObjectId;
  planName: string;
  status: MembershipStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  /** Last successful Cashfree order id - support/debugging reference only, no recurring-mandate
   * concept the way Stripe's customer/subscription ids implied. */
  gatewayOrderId?: string;
  currentPeriodEnd?: Date;
  startDate: Date;
  endDate?: Date;
  /** Last time an admin manually sent a "payment due" push - lets the UI show "reminded 2 days
   * ago" and rate-limits repeated reminders (see billing/service.ts's sendPaymentReminder()). */
  lastPaymentReminderAt?: Date;
}

const membershipSchema = new Schema<MembershipDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
  planName: { type: String, required: true },
  status: { type: String, enum: MEMBERSHIP_STATUSES, required: true, default: 'incomplete' },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'due' },
  paymentMethod: { type: String, enum: PAYMENT_METHODS },
  gatewayOrderId: { type: String },
  currentPeriodEnd: { type: Date },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  lastPaymentReminderAt: { type: Date },
});

export const MembershipModel = model<MembershipDocument>('Membership', membershipSchema);
