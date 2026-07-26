import type { User, LoginInput, RegisterInput, ForgotPasswordInput } from '@fitpulse/shared';
import { api } from './client';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const login = (input: LoginInput) =>
  api.post<{ user: User } & AuthTokens>('/auth/login', input);

export const register = (input: RegisterInput) =>
  api.post<{ user: User } & AuthTokens>('/auth/register', input);

export const refresh = (refreshToken: string) =>
  api.post<AuthTokens>('/auth/refresh', { refreshToken });

export const logoutRequest = (refreshToken: string) =>
  api.post<{ message: string }>('/auth/logout', { refreshToken });

export const forgotPassword = (input: ForgotPasswordInput) =>
  api.post<{ message: string }>('/auth/forgot-password', input);

/** Redeems a one-time QR device-pairing token (see the "Scan to sign in" flow) - same response
 * shape as a normal login, just a different way of proving identity. */
export const pairDevice = (token: string) =>
  api.post<{ user: User } & AuthTokens>('/auth/pair', { token });
