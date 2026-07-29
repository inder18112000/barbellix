import { makeAutoObservable, runInAction } from 'mobx'
import type { User } from '@barbellix/shared'
import { persistTokens, clearPersistedTokens, loadPersistedTokens, setOnSessionExpired } from '../api/client'
import { fetchMe } from '../api/queries'
import { logoutRequest } from '../api/auth'

class AuthStore {
  user: User | null = null
  accessToken: string | null = null
  refreshToken: string | null = null
  isAuthenticated = false
  /** True until the initial token-restore-and-validate pass on app boot completes. */
  isHydrating = true

  constructor() {
    makeAutoObservable(this)
  }

  async hydrate() {
    const { accessToken, refreshToken } = loadPersistedTokens()
    if (!accessToken || !refreshToken) {
      runInAction(() => {
        this.isHydrating = false
      })
      return
    }

    try {
      const user = await fetchMe()
      runInAction(() => {
        this.user = user
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.isAuthenticated = true
        this.isHydrating = false
      })
    } catch {
      // Access token expired and the automatic refresh-retry in api/client.ts also failed
      // (refresh token itself expired/revoked) - the session is genuinely over.
      clearPersistedTokens()
      runInAction(() => {
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        this.isAuthenticated = false
        this.isHydrating = false
      })
    }
  }

  login(user: User, accessToken: string, refreshToken: string) {
    persistTokens({ accessToken, refreshToken })
    this.user = user
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.isAuthenticated = true
  }

  async logout() {
    const token = this.refreshToken
    if (token) {
      // Best-effort - revokes the token server-side so it can't be replayed, but local
      // state is cleared regardless of whether the network call succeeds.
      await logoutRequest(token).catch(() => {})
    }
    clearPersistedTokens()
    runInAction(() => {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
    })
  }

  setUser(user: User) {
    this.user = user
  }
}

export const authStore = new AuthStore()

setOnSessionExpired(() => {
  authStore.logout()
})
