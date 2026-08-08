import type { HydratedDocument } from 'mongoose';
import { isValidObjectId } from '../../lib/objectId.js';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { sendPushToUser } from '../../lib/push.js';
import { getNotificationPreferences } from '../users/service.js';
import type { UserDocument } from '../../db/models/User.js';
import * as repo from './repository.js';

const THREAD_PAGE_SIZE = 100;

/** Being in the same tenant is necessary but not sufficient once a trainer is involved: a
 * member/trainer pair may only message each other if that specific assignment exists (Assigned
 * scope, not Tenant scope - see docs/prd/01-rbac-and-data-model.md §1.1 for the same distinction
 * made platform-wide). Admin/superadmin on either side, or a pair with no trainer at all, stay
 * tenant-scoped as before. */
function assertCanMessage(self: HydratedDocument<UserDocument>, other: HydratedDocument<UserDocument>) {
  const [trainer, member] =
    self.role === 'trainer' && other.role === 'member'
      ? [self, other]
      : other.role === 'trainer' && self.role === 'member'
        ? [other, self]
        : [];
  if (!trainer || !member) return; // no trainer<->member pair involved - tenant scope is enough

  if (member.assignedTrainerId?.toString() !== trainer._id.toString()) {
    throw new ForbiddenError('You can only message your assigned trainer or your own assigned members');
  }
}

export async function getThread(userId: string, tenantId: string, otherUserId: string) {
  if (!isValidObjectId(otherUserId)) throw new NotFoundError('User not found');

  const [self, other] = await Promise.all([repo.findUserInTenant(userId, tenantId), repo.findUserInTenant(otherUserId, tenantId)]);
  if (!self || !other) throw new NotFoundError('User not found');
  assertCanMessage(self, other);

  const docs = await repo.findThread(userId, otherUserId, THREAD_PAGE_SIZE);
  return docs.map(repo.toDomainMessage).reverse();
}

export async function sendMessage(senderId: string, tenantId: string, recipientId: string, text: string) {
  if (!isValidObjectId(recipientId)) throw new NotFoundError('Recipient not found');

  const [sender, recipient] = await Promise.all([repo.findUserInTenant(senderId, tenantId), repo.findUserInTenant(recipientId, tenantId)]);
  if (!sender) throw new NotFoundError('Sender not found');
  if (!recipient) throw new NotFoundError('Recipient not found');
  assertCanMessage(sender, recipient);

  const doc = await repo.create({ tenantId, senderId, recipientId, text });
  const message = repo.toDomainMessage(doc);

  const prefs = await getNotificationPreferences(recipientId);
  if (prefs.trainerMessages) {
    await sendPushToUser(recipientId, {
      title: sender ? `${sender.firstName} ${sender.lastName}` : 'New message',
      body: text.length > 100 ? `${text.slice(0, 97)}...` : text,
      data: { type: 'message', senderId },
    });
  }

  return message;
}

export async function markMessageRead(id: string, recipientId: string) {
  if (!isValidObjectId(id)) throw new NotFoundError('Message not found');

  const doc = await repo.markRead(id, recipientId);
  if (!doc) throw new NotFoundError('Message not found');
  return repo.toDomainMessage(doc);
}
