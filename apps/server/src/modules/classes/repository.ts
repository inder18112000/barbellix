import type { HydratedDocument } from 'mongoose';
import type { ClassTemplate, ClassSession, Booking, BookingStatus } from '@fitpulse/shared';
import { ClassTemplateModel, type ClassTemplateDocument } from '../../db/models/ClassTemplate.js';
import { ClassSessionModel, type ClassSessionDocument } from '../../db/models/ClassSession.js';
import { BookingModel, type BookingDocument } from '../../db/models/Booking.js';
import { UserModel } from '../../db/models/User.js';

export function toDomainTemplate(doc: HydratedDocument<ClassTemplateDocument>): ClassTemplate {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    branchId: doc.branchId.toString(),
    name: doc.name,
    trainerId: doc.trainerId.toString(),
    occurrences: doc.occurrences,
    capacity: doc.capacity,
    active: doc.active,
  };
}

export function toDomainSession(doc: HydratedDocument<ClassSessionDocument>, myBookingStatus?: BookingStatus): ClassSession {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    branchId: doc.branchId.toString(),
    templateId: doc.templateId.toString(),
    name: doc.name,
    trainerId: doc.trainerId.toString(),
    date: doc.date,
    startTime: doc.startTime,
    durationMins: doc.durationMins,
    capacity: doc.capacity,
    bookedCount: doc.bookedCount,
    waitlistCount: doc.waitlistCount,
    status: doc.status,
    myBookingStatus,
  };
}

export function toDomainBooking(doc: HydratedDocument<BookingDocument>): Booking {
  return {
    id: doc._id.toString(),
    tenantId: doc.tenantId.toString(),
    sessionId: doc.sessionId.toString(),
    userId: doc.userId.toString(),
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function findTemplatesByTenant(tenantId: string) {
  return ClassTemplateModel.find({ tenantId }).sort({ name: 1 });
}

export async function findTemplateById(templateId: string, tenantId: string) {
  return ClassTemplateModel.findOne({ _id: templateId, tenantId });
}

export async function createTemplate(input: {
  tenantId: string;
  branchId: string;
  name: string;
  trainerId: string;
  occurrences: { dayOfWeek: number; startTime: string; durationMins: number }[];
  capacity: number;
}) {
  return ClassTemplateModel.create(input);
}

export async function updateTemplate(templateId: string, tenantId: string, updates: Record<string, unknown>) {
  return ClassTemplateModel.findOneAndUpdate({ _id: templateId, tenantId }, { $set: updates }, { new: true });
}

// ─── Sessions - lazy generation ────────────────────────────────────────────────

function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** Diffs active templates against the requested date range and creates any missing sessions via
 * upsert-on-{templateId,date} - safe to call repeatedly (or concurrently) for an overlapping
 * range, since $setOnInsert only takes effect the first time a given session is created. */
export async function generateSessionsForRange(tenantId: string, branchId: string, from: string, to: string) {
  const templates = await ClassTemplateModel.find({ tenantId, branchId, active: true });
  if (templates.length === 0) return;

  const dates = enumerateDates(from, to);
  const ops = [];

  for (const template of templates) {
    for (const dateStr of dates) {
      const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
      for (const occurrence of template.occurrences) {
        if (occurrence.dayOfWeek !== dayOfWeek) continue;
        ops.push({
          updateOne: {
            filter: { templateId: template._id, date: dateStr },
            update: {
              $setOnInsert: {
                tenantId: template.tenantId,
                branchId: template.branchId,
                templateId: template._id,
                name: template.name,
                trainerId: template.trainerId,
                date: dateStr,
                startTime: occurrence.startTime,
                durationMins: occurrence.durationMins,
                capacity: template.capacity,
                bookedCount: 0,
                waitlistCount: 0,
                status: 'scheduled' as const,
              },
            },
            upsert: true,
          },
        });
      }
    }
  }

  if (ops.length > 0) await ClassSessionModel.bulkWrite(ops, { ordered: false });
}

export async function findSessionsInRange(branchId: string, from: string, to: string) {
  return ClassSessionModel.find({ branchId, date: { $gte: from, $lte: to } }).sort({ date: 1, startTime: 1 });
}

export async function findSessionById(sessionId: string) {
  return ClassSessionModel.findById(sessionId);
}

// ─── Bookings - atomic capacity/waitlist ───────────────────────────────────────

/** Atomically claims a seat if one is free; returns null if the session was already full (caller
 * should waitlist instead). The $lt check and $inc happen in the same query, so two concurrent
 * bookings against the last open seat can't both succeed. */
export async function tryClaimSeat(sessionId: string) {
  return ClassSessionModel.findOneAndUpdate(
    { _id: sessionId, $expr: { $lt: ['$bookedCount', '$capacity'] } },
    { $inc: { bookedCount: 1 } },
    { new: true },
  );
}

export async function incrementWaitlist(sessionId: string) {
  return ClassSessionModel.findOneAndUpdate({ _id: sessionId }, { $inc: { waitlistCount: 1 } }, { new: true });
}

export async function incrementBookedCount(sessionId: string) {
  return ClassSessionModel.findOneAndUpdate({ _id: sessionId }, { $inc: { bookedCount: 1 } }, { new: true });
}

export async function decrementBookedCount(sessionId: string) {
  return ClassSessionModel.findOneAndUpdate({ _id: sessionId }, { $inc: { bookedCount: -1 } }, { new: true });
}

export async function decrementWaitlistCount(sessionId: string) {
  return ClassSessionModel.findOneAndUpdate({ _id: sessionId }, { $inc: { waitlistCount: -1 } }, { new: true });
}

export async function createBooking(input: { tenantId: string; sessionId: string; userId: string; status: BookingStatus }) {
  return BookingModel.create(input);
}

export async function findActiveBookingForUser(sessionId: string, userId: string) {
  return BookingModel.findOne({ sessionId, userId, status: { $ne: 'cancelled' } });
}

export async function findBookingById(bookingId: string) {
  return BookingModel.findById(bookingId);
}

export async function cancelBooking(bookingId: string) {
  return BookingModel.findOneAndUpdate({ _id: bookingId }, { $set: { status: 'cancelled' } }, { new: true });
}

/** The atomic promotion step: flips the oldest still-waitlisted booking for this session to
 * "booked" - null if nobody was waiting. Called synchronously from the cancel flow, since there's
 * no job queue to defer it to. */
export async function promoteNextWaitlisted(sessionId: string) {
  return BookingModel.findOneAndUpdate(
    { sessionId, status: 'waitlisted' },
    { $set: { status: 'booked' } },
    { sort: { createdAt: 1 }, new: true },
  );
}

export async function findBookingsForSession(sessionId: string) {
  return BookingModel.find({ sessionId, status: { $ne: 'cancelled' } }).sort({ status: 1, createdAt: 1 });
}

export async function findBookingsForUser(userId: string) {
  return BookingModel.find({ userId, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 });
}

/** Scoped to a specific set of sessions (e.g. "what's this user's status across today's
 * schedule view") rather than every booking they've ever made. */
export async function findActiveBookingsForUserInSessions(userId: string, sessionIds: string[]) {
  const bookings = await BookingModel.find({ userId, sessionId: { $in: sessionIds }, status: { $ne: 'cancelled' } });
  return new Map(bookings.map((b) => [b.sessionId.toString(), b.status]));
}

/** Batched name lookup for enriching sessions/rosters with trainer or member display names -
 * one query for every id needed instead of one per row (see attendance/trainer's *ForUsers
 * batching from the earlier N+1 fix). */
export async function findUserNamesByIds(userIds: string[]) {
  const users = await UserModel.find({ _id: { $in: userIds } }).select('firstName lastName email');
  return new Map(users.map((u) => [u._id.toString(), { name: `${u.firstName} ${u.lastName}`, email: u.email }]));
}

/** For the trainer-picker on the "create class template" form - staff only, not the member roster. */
export async function findTrainersByTenant(tenantId: string) {
  return UserModel.find({ tenantId, role: { $in: ['trainer', 'admin', 'superadmin'] } }).select('firstName lastName');
}
