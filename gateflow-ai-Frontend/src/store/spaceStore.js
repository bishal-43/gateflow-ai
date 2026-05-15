/**
 * spaceStore.js — Active space selection state.
 *
 * Tracks which space the user is currently working in.
 * Actual space data is fetched via useSpaces() (TanStack Query).
 * This store only holds the selected space ID for cross-component access.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSpaceStore = create(
  persist(
    (set) => ({
      /** @type {string | null} Currently selected space ID */
      activeSpaceId: null,

      setActiveSpaceId: (id) => set({ activeSpaceId: id }),

      clearActiveSpace: () => set({ activeSpaceId: null }),
    }),
    {
      name: 'gateflow-active-space',
      partialize: (state) => ({ activeSpaceId: state.activeSpaceId }),
    },
  ),
)
