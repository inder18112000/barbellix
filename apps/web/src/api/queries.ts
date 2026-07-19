import type { User } from '@fitpulse/shared'
import { api } from './client'

export const fetchMe = () => api.get<User>('/me')
