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
