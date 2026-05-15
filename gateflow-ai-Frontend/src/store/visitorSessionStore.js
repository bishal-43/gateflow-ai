/**
 * visitorSessionStore.js — Token-based visitor session.
 *
 * Populated when visitor opens /invite/:token and backend resolves it.
 * No JWT — this is a temporary session scoped to one invite.
 *
 * Shape mirrors backend schemas/visitor.py InviteOpenResponse:
 *   invite_id, visitor_name, invite_type, status,
 *   valid_from, valid_until, space (VisitorSpaceInfo), qr_code_b64
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useVisitorSessionStore = create(
  persist(
    (set) => ({
      inviteToken: null,
      inviteId: null,
      visitorName: null,
      inviteType: null,
      status: null,
      validFrom: null,
      validUntil: null,
      qrCodeB64: null,
      space: null, // { id, type, name, venue, address, start_time, end_time }
      isLoaded: false,

      /**
       * Load session from backend InviteOpenResponse.
       * @param {string} token — the raw URL token
       * @param {object} data  — InviteOpenResponse from backend
       */
      loadSession: (token, data) => {
        set({
          inviteToken: token,
          inviteId: data.invite_id,
          visitorName: data.visitor_name,
          inviteType: data.invite_type,
          status: data.status,
          validFrom: data.valid_from,
          validUntil: data.valid_until,
          qrCodeB64: data.qr_code_b64,
          space: data.space,
          isLoaded: true,
        })
      },

      clearSession: () => {
        set({
          inviteToken: null, inviteId: null, visitorName: null,
          inviteType: null, status: null, validFrom: null,
          validUntil: null, qrCodeB64: null, space: null, isLoaded: false,
        })
      },
    }),
    {
      name: 'gateflow-visitor-session',
      partialize: (state) => ({
        inviteToken: state.inviteToken,
        inviteId: state.inviteId,
        visitorName: state.visitorName,
        inviteType: state.inviteType,
        status: state.status,
        validFrom: state.validFrom,
        validUntil: state.validUntil,
        qrCodeB64: state.qrCodeB64,
        space: state.space,
        isLoaded: state.isLoaded,
      }),
    },
  ),
)
