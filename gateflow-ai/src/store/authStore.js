/**
 * authStore.js — Authentication state (Zustand + persist).
 *
 * Stores JWT access token, refresh token, user profile, and role.
 * The axios interceptor reads this store to attach Bearer tokens.
 *
 * Roles (from backend models/user.py UserRole enum):
 *   ORGANIZER | RESIDENT | GUARD | RESIDENTIAL_GUARD | ADMIN
 *
 * Visitors are NOT authenticated — they use token-based sessions (visitorSessionStore).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      /** @type {{ id, email, full_name, role, avatar_url, is_active, is_verified } | null} */
      user: null,
      /** @type {string | null} JWT access token */
      token: null,
      /** @type {string | null} JWT refresh token */
      refreshToken: null,
      /** @type {'ORGANIZER'|'RESIDENT'|'GUARD'|'RESIDENTIAL_GUARD'|'ADMIN'|null} */
      role: null,
      isAuthenticated: false,

      /**
       * Called after successful login or register.
       * @param {object} user
       * @param {string} accessToken
       * @param {string} refreshToken
       */
      login: (user, accessToken, refreshToken) => {
        set({
          user,
          token: accessToken,
          refreshToken,
          role: user.role,
          isAuthenticated: true,
        })
      },

      /**
       * Update tokens after silent refresh.
       * @param {string} accessToken
       * @param {string} refreshToken
       */
      setTokens: (accessToken, refreshToken) => {
        set({ token: accessToken, refreshToken })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
        })
      },

      updateUser: (updates) => {
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }))
      },
    }),
    {
      name: 'gateflow-auth',
      // Only persist what's needed — don't persist derived state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
