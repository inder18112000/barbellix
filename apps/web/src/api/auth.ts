import type { User, LoginInput } from '@barbellix/shared'
import { api } from './client'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const login = (input: LoginInput) => api.post<{ user: User } & AuthTokens>('/auth/login', input)

export const logoutRequest = (refreshToken: string) => api.post<{ message: string }>('/auth/logout', { refreshToken })
