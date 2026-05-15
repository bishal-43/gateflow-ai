/**
 * useWalkins.js — Walk-in request hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import walkinService from '@/services/walkinService'
import { toast } from '@/components/ui/Toast'

export const WALKINS_KEY = ['walkins']

export function usePendingWalkins(spaceId) {
  return useQuery({
    queryKey: [...WALKINS_KEY, 'pending', spaceId],
    queryFn: () => walkinService.listPending(spaceId),
    enabled: true,
    refetchInterval: 15_000,
    staleTime: 10_000,
    select: (data) => data.requests ?? [],
  })
}

export function useCreateWalkin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: walkinService.createRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALKINS_KEY })
      toast('Walk-in request submitted', 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useApproveWalkin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: walkinService.approve,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: WALKINS_KEY })
      toast(`${data.visitor_name} approved — QR generated`, 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useRejectWalkin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ walkinId, note }) => walkinService.reject(walkinId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WALKINS_KEY })
      toast('Walk-in rejected', 'info')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}
