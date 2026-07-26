import type { Types } from 'mongoose';

/** The `doc._id.toString()` / `doc.tenantId.toString()` cast repeated by hand in every module's
 * toDomainX() mapper - a shared name for the same one-line conversion. */
export function idStr(id: Types.ObjectId | string): string {
  return typeof id === 'string' ? id : id.toString();
}

/** The `doc.someDate?.toISOString()` cast repeated by hand in every module's toDomainX() mapper. */
export function isoStr(date: Date): string;
export function isoStr(date: Date | undefined): string | undefined;
export function isoStr(date?: Date): string | undefined {
  return date?.toISOString();
}
