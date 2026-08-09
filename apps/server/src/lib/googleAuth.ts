import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
}

let cachedClient: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!cachedClient) cachedClient = new OAuth2Client();
  return cachedClient;
}

/** Verifies a Google Identity Services ID token's signature and audience against our own
 * GOOGLE_CLIENT_ID - throws if the token is invalid, expired, meant for a different client, or
 * the underlying Google account's email isn't verified. Callers should treat any throw here as
 * "reject the sign-in attempt," not surface the raw error to the client. */
export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleProfile> {
  const ticket = await getClient().verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new Error('Google account email is missing or unverified');
  }

  const [fallbackFirst, ...fallbackRest] = (payload.name ?? payload.email.split('@')[0]).split(' ');

  return {
    email: payload.email,
    firstName: payload.given_name ?? fallbackFirst,
    lastName: payload.family_name ?? fallbackRest.join(' '),
  };
}
