/**
 * useInvites.js — Invite management hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import inviteService from '@/services/inviteService'
import { toast } from '@/components/ui/Toast'

export const INVITES_KEY = ['invites']

export function useInvites({ spaceId, status } = {}) {
  return useQuery({
    queryKey: [...INVITES_KEY, { spaceId, status }],
    queryFn: () => inviteService.list({ spaceId, status }),
    staleTime: 30_000,
    select: (data) => data,
  })
}

export function useCreateInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inviteService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVITES_KEY })
      toast('Invite created', 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useRevokeInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inviteService.revoke,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVITES_KEY })
      toast('Invite revoked', 'info')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}
