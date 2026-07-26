import * as push from '../../lib/push.js';

export async function registerDeviceToken(
  userId: string,
  tenantId: string,
  input: { expoPushToken: string; platform: 'ios' | 'android' | 'web' },
) {
  const doc = await push.registerDeviceToken({ userId, tenantId, ...input });
  return { id: doc._id.toString(), registered: true };
}

export async function unregisterDeviceToken(expoPushToken: string) {
  await push.unregisterDeviceToken(expoPushToken);
  return { unregistered: true };
}
