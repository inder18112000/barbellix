import { create } from 'zustand';
import type { User } from '@fitpulse/shared';
import {
  persistTokens,
  clearPersistedTokens,
  loadPersistedTokens,
  setOnSessionExpired,
} from '../api/client';
import { fetchMe } from '../api/queries';
import { logoutRequest } from '../api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** True until the initial token-restore-and-validate pass on app boot completes. */
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  /**
   * Activates real tokens (so authenticated API calls work) without flipping
   * isAuthenticated - used right after registration so the remaining onboarding
   * steps (GoalSelection, BodyStats) stay reachable. RootNavigator switches away
   * from AuthNavigator the instant isAuthenticated is true, which would skip
   * onboarding entirely if a full login() fired here instead.
   */
  beginRegistration: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  /** Called at the true end of onboarding (BodyStats save or skip) to finish what beginRegistration started. */
  completeOnboarding: () => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrating: true,

  hydrate: async () => {
    const { accessToken, refreshToken } = await loadPersistedTokens();
    if (!accessToken || !refreshToken) {
      set({ isHydrating: false });
      return;
    }

    try {
      const user = await fetchMe();
      set({ user, accessToken, refreshToken, isAuthenticated: true, isHydrating: false });
    } catch {
      // Access token expired and the automatic refresh-retry in api/client.ts also
      // failed (refresh token itself expired/revoked) - the session is genuinely over.
      await clearPersistedTokens();
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isHydrating: false });
    }
  },

  login: async (user, accessToken, refreshToken) => {
    await persistTokens({ accessToken, refreshToken });
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  beginRegistration: async (user, accessToken, refreshToken) => {
    await persistTokens({ accessToken, refreshToken });
    set({ user, accessToken, refreshToken });
  },

  completeOnboarding: () => set({ isAuthenticated: true }),

  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      // Best-effort - revokes the token server-side so it can't be replayed, but
      // local state is cleared regardless of whether the network call succeeds.
      await logoutRequest(refreshToken).catch(() => {});
    }
    await clearPersistedTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));

setOnSessionExpired(() => {
  useAuthStore.getState().logout();
});
