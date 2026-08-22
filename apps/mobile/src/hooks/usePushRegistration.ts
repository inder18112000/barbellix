import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { registerDeviceToken } from '../api/queries';

/** Requests notification permission and registers this device's Expo push token with the
 * server, once per authenticated session. No-ops quietly if push isn't set up for this build
 * (no EAS projectId configured yet) or permission is denied - registration failing must never
 * block the rest of the app. */
export function usePushRegistration(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    // Remote push was removed from Expo Go on Android/iOS as of SDK 53 - calling
    // getExpoPushTokenAsync() there logs a scary console error every time regardless of this
    // try/catch, so skip it entirely rather than let it fire and swallow the result.
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

    let cancelled = false;

    (async () => {
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;

        const { status: existing } = await Notifications.getPermissionsAsync();
        let status = existing;
        if (status !== 'granted') {
          ({ status } = await Notifications.requestPermissionsAsync());
        }
        if (status !== 'granted' || cancelled) return;

        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled) return;

        const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
        await registerDeviceToken(expoPushToken, platform);
      } catch {
        // Best-effort - a push-registration failure must never block app usage.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
