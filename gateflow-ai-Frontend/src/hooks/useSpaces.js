/**
 * useSpaces.js — Space management hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import spaceService from '@/services/spaceService'
import { toast } from '@/components/ui/Toast'

export const SPACES_KEY = ['spaces']

export function useSpaces() {
  return useQuery({
    queryKey: SPACES_KEY,
    queryFn: spaceService.list,
    staleTime: 60_000,
    select: (data) => data.spaces ?? [],
  })
}

export function useSpace(spaceId) {
  return useQuery({
    queryKey: [...SPACES_KEY, spaceId],
    queryFn: () => spaceService.getOne(spaceId),
    enabled: !!spaceId,
    staleTime: 60_000,
  })
}

export function useCreateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: spaceService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SPACES_KEY })
      toast('Space created successfully', 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useUpdateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ spaceId, data }) => spaceService.update(spaceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SPACES_KEY })
      toast('Space updated', 'success')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}

export function useDeleteSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: spaceService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SPACES_KEY })
      toast('Space deleted', 'info')
    },
    onError: (err) => toast(err.message, 'error'),
  })
}
