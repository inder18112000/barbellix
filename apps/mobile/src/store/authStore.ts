import { create } from 'zustand';
import type { User } from '@fitpulse/shared';
import { setAuthToken } from '../api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Dev shortcut: pre-authenticated with mock user
  user: __DEV__ ? require('../mocks/data').mockUser : null,
  accessToken: __DEV__ ? 'mock_token' : null,
  isAuthenticated: __DEV__ ? true : false,

  login: (user, token) => {
    setAuthToken(token);
    set({ user, accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
