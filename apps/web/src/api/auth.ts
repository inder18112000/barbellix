import type { User, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '@barbellix/shared'
import { api } from './client'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const login = (input: LoginInput) => api.post<{ user: User } & AuthTokens>('/auth/login', input)

export const loginWithGoogle = (idToken: string) => api.post<{ user: User } & AuthTokens>('/auth/google', { idToken })

export const logoutRequest = (refreshToken: string) => api.post<{ message: string }>('/auth/logout', { refreshToken })

export const forgotPassword = (input: ForgotPasswordInput) => api.post<{ message: string }>('/auth/forgot-password', input)

export const resetPassword = (input: ResetPasswordInput) => api.post<{ message: string }>('/auth/reset-password', input)
