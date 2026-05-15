/**
 * useOverstays.js — Overstay detection hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import overstayService from '@/services/overstayService'
import { toast } from '@/components/ui/Toast'

export const OVERSTAY_KEY = (spaceId) => ['overstays', spaceId]

export function useOverstays(spaceId) {
  return useQuery({
    queryKey: OVERSTAY_KEY(spaceId),
    queryFn: () => overstayService.getActive(spaceId),
    enabled: !!spaceId,
    refetchInterval: 60_000,
    staleTime: 30_000,
    select: (data) => data.sessions ?? [],
  })
}

export function useResolveOverstay(spaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: overstayService.resolve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OVERSTAY_KEY(spaceId) })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast('Overstay resolved', 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}
