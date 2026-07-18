import { isValidObjectId } from '../../lib/objectId.js';
import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';

const THREAD_PAGE_SIZE = 100;

export async function getThread(userId: string, tenantId: string, otherUserId: string) {
  if (!isValidObjectId(otherUserId)) throw new NotFoundError('User not found');

  const other = await repo.findUserInTenant(otherUserId, tenantId);
  if (!other) throw new NotFoundError('User not found');

  const docs = await repo.findThread(userId, otherUserId, THREAD_PAGE_SIZE);
  return docs.map(repo.toDomainMessage).reverse();
}

export async function sendMessage(senderId: string, tenantId: string, recipientId: string, text: string) {
  if (!isValidObjectId(recipientId)) throw new NotFoundError('Recipient not found');

  const recipient = await repo.findUserInTenant(recipientId, tenantId);
  if (!recipient) throw new NotFoundError('Recipient not found');

  const doc = await repo.create({ tenantId, senderId, recipientId, text });
  return repo.toDomainMessage(doc);
}

export async function markMessageRead(id: string, recipientId: string) {
  if (!isValidObjectId(id)) throw new NotFoundError('Message not found');

  const doc = await repo.markRead(id, recipientId);
  if (!doc) throw new NotFoundError('Message not found');
  return repo.toDomainMessage(doc);
}
