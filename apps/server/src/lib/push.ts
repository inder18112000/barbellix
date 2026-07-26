import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { DeviceTokenModel } from '../db/models/DeviceToken.js';

let client: Expo | null = null;

function getClient(): Expo {
  if (client) return client;
  // No access token is required for basic sending - Expo's push service works without one.
  // EXPO_ACCESS_TOKEN (optional) just raises rate limits and enables enhanced security.
  client = new Expo(process.env.EXPO_ACCESS_TOKEN ? { accessToken: process.env.EXPO_ACCESS_TOKEN } : undefined);
  return client;
}

export async function registerDeviceToken(input: {
  userId: string;
  tenantId: string;
  expoPushToken: string;
  platform: 'ios' | 'android' | 'web';
}) {
  return DeviceTokenModel.findOneAndUpdate(
    { expoPushToken: input.expoPushToken },
    { $set: { userId: input.userId, tenantId: input.tenantId, platform: input.platform, lastSeenAt: new Date() } },
    { upsert: true, new: true },
  );
}

export async function unregisterDeviceToken(expoPushToken: string) {
  await DeviceTokenModel.deleteOne({ expoPushToken });
}

/** Sends to every device registered for this user - best-effort, never throws, so a push
 * failure never breaks the business action (booking a class, sending a message) that triggered
 * it. Prunes any token Expo reports as no longer registered (uninstalled app, etc). */
export async function sendPushToUser(userId: string, message: { title: string; body: string; data?: Record<string, unknown> }) {
  try {
    const tokens = await DeviceTokenModel.find({ userId });
    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.expoPushToken));
    if (validTokens.length === 0) return;

    const expo = getClient();
    const messages: ExpoPushMessage[] = validTokens.map((t) => ({
      to: t.expoPushToken,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const staleTokens: string[] = [];

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          staleTokens.push(chunk[i]!.to as string);
        }
      });
    }

    if (staleTokens.length > 0) {
      await DeviceTokenModel.deleteMany({ expoPushToken: { $in: staleTokens } });
    }
  } catch {
    // Best-effort: a push-delivery failure must never fail the caller's real business action.
  }
}
