import type { ClassTemplateOccurrence } from '@fitpulse/shared';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../lib/errors.js';
import * as repo from './repository.js';

const MAX_SCHEDULE_RANGE_DAYS = 42; // ~6 weeks - keeps lazy generation bounded, see repo.generateSessionsForRange
const CANCEL_CUTOFF_MINS = 60;

function daysBetween(from: string, to: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / msPerDay);
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function listTemplates(tenantId: string) {
  const docs = await repo.findTemplatesByTenant(tenantId);
  const trainerNames = await repo.findUserNamesByIds([...new Set(docs.map((d) => d.trainerId.toString()))]);
  return docs.map((doc) => ({ ...repo.toDomainTemplate(doc), trainerName: trainerNames.get(doc.trainerId.toString())?.name }));
}

export async function createTemplate(
  tenantId: string,
  input: { branchId: string; name: string; trainerId: string; occurrences: ClassTemplateOccurrence[]; capacity: number },
) {
  const doc = await repo.createTemplate({ tenantId, ...input });
  return repo.toDomainTemplate(doc);
}

export async function updateTemplate(
  tenantId: string,
  templateId: string,
  updates: Partial<{ name: string; trainerId: string; occurrences: ClassTemplateOccurrence[]; capacity: number; active: boolean }>,
) {
  const updated = await repo.updateTemplate(templateId, tenantId, updates);
  if (!updated) throw new NotFoundError('Class template not found');
  return repo.toDomainTemplate(updated);
}

export async function listTrainers(tenantId: string) {
  const docs = await repo.findTrainersByTenant(tenantId);
  return docs.map((doc) => ({ id: doc._id.toString(), name: `${doc.firstName} ${doc.lastName}` }));
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function getSchedule(tenantId: string, branchId: string, from: string, to: string, requestingUserId: string) {
  const rangeDays = daysBetween(from, to);
  if (rangeDays < 0) throw new ValidationError('`to` must not be before `from`');
  if (rangeDays > MAX_SCHEDULE_RANGE_DAYS) throw new ValidationError(`Schedule range can't exceed ${MAX_SCHEDULE_RANGE_DAYS} days`);

  await repo.generateSessionsForRange(tenantId, branchId, from, to);
  const sessions = await repo.findSessionsInRange(branchId, from, to);

  const [trainerNames, myBookings] = await Promise.all([
    repo.findUserNamesByIds([...new Set(sessions.map((s) => s.trainerId.toString()))]),
    repo.findActiveBookingsForUserInSessions(requestingUserId, sessions.map((s) => s._id.toString())),
  ]);

  return sessions.map((doc) => ({
    ...repo.toDomainSession(doc, myBookings.get(doc._id.toString())),
    trainerName: trainerNames.get(doc.trainerId.toString())?.name,
  }));
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export async function bookSession(tenantId: string, userId: string, sessionId: string) {
  const session = await repo.findSessionById(sessionId);
  if (!session || session.tenantId.toString() !== tenantId) throw new NotFoundError('Class session not found');
  if (session.status === 'cancelled') throw new ConflictError('This class has been cancelled');

  const existing = await repo.findActiveBookingForUser(sessionId, userId);
  if (existing) throw new ConflictError('You already have a booking for this class');

  const claimed = await repo.tryClaimSeat(sessionId);
  if (claimed) {
    const booking = await repo.createBooking({ tenantId, sessionId, userId, status: 'booked' });
    return { booking: repo.toDomainBooking(booking), status: 'booked' as const };
  }

  await repo.incrementWaitlist(sessionId);
  const booking = await repo.createBooking({ tenantId, sessionId, userId, status: 'waitlisted' });
  return { booking: repo.toDomainBooking(booking), status: 'waitlisted' as const };
}

export async function cancelMyBooking(tenantId: string, userId: string, bookingId: string) {
  const booking = await repo.findBookingById(bookingId);
  if (!booking || booking.tenantId.toString() !== tenantId || booking.userId.toString() !== userId) {
    throw new NotFoundError('Booking not found');
  }
  if (booking.status === 'cancelled') throw new ConflictError('This booking is already cancelled');

  const session = await repo.findSessionById(booking.sessionId.toString());
  if (!session) throw new NotFoundError('Class session not found');

  const startsAt = new Date(`${session.date}T${session.startTime}:00Z`);
  const minsUntilStart = (startsAt.getTime() - Date.now()) / 60_000;
  if (minsUntilStart < CANCEL_CUTOFF_MINS) {
    throw new ForbiddenError(`Bookings can't be cancelled within ${CANCEL_CUTOFF_MINS} minutes of class start`);
  }

  const wasBooked = booking.status === 'booked';
  await repo.cancelBooking(bookingId);

  let promotedUserId: string | undefined;
  if (wasBooked) {
    await repo.decrementBookedCount(session._id.toString());
    const promoted = await repo.promoteNextWaitlisted(session._id.toString());
    if (promoted) {
      await repo.decrementWaitlistCount(session._id.toString());
      await repo.incrementBookedCount(session._id.toString());
      promotedUserId = promoted.userId.toString();
    }
  } else {
    await repo.decrementWaitlistCount(session._id.toString());
  }

  // Hook point for M2 (push notifications): if promotedUserId is set, that member just moved
  // from waitlisted to booked and should get a "you're in!" push.
  return { cancelled: true, promotedUserId };
}

export async function getMyBookings(userId: string) {
  const bookings = await repo.findBookingsForUser(userId);
  const sessions = await Promise.all(bookings.map((b) => repo.findSessionById(b.sessionId.toString())));

  return bookings
    .map((booking, i) => {
      const session = sessions[i];
      if (!session) return null;
      return { ...repo.toDomainBooking(booking), session: repo.toDomainSession(session, booking.status) };
    })
    .filter((b) => b !== null);
}

export async function getRoster(tenantId: string, sessionId: string) {
  const session = await repo.findSessionById(sessionId);
  if (!session || session.tenantId.toString() !== tenantId) throw new NotFoundError('Class session not found');

  const bookings = await repo.findBookingsForSession(sessionId);
  const names = await repo.findUserNamesByIds(bookings.map((b) => b.userId.toString()));

  return {
    session: repo.toDomainSession(session),
    bookings: bookings.map((b) => ({
      ...repo.toDomainBooking(b),
      memberName: names.get(b.userId.toString())?.name,
      memberEmail: names.get(b.userId.toString())?.email,
    })),
  };
}
