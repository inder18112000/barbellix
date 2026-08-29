import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ValidationError } from './errors.js';

/** User.phone is free-text and optional - normalized to E.164 only at the point of use (SMS
 * send, Cashfree order creation) rather than validated at the schema level, so existing accounts
 * with no/malformed phone data don't suddenly break. Defaults to India since that's this
 * deployment's market (Cashfree/UPI), used only when the raw input has no country code of its own. */
export function toE164(rawPhone: string | undefined | null, defaultCountry: 'IN' = 'IN'): string {
  if (!rawPhone) throw new ValidationError('This member has no phone number on file - add one first');

  const parsed = parsePhoneNumberFromString(rawPhone, defaultCountry);
  if (!parsed || !parsed.isValid()) throw new ValidationError('This member\'s phone number looks invalid - update it first');

  return parsed.number;
}
