/**
 * useEntry.js — Entry and exit scanning hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import entryService from '@/services/entryService'
import exitService from '@/services/exitService'
import { DASHBOARD_KEY } from './useDashboard'
import { toast } from '@/components/ui/Toast'

export function useEntryScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: entryService.scan,
    onSuccess: (data) => {
      // Invalidate dashboard so occupancy updates
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(`Entry recorded — ${data.visitor_name}`, 'success')
    },
    onError: (err) => toast(err.message ?? 'Entry scan failed', 'error'),
  })
}

export function useExitScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: exitService.scan,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(`Exit recorded — ${data.visitor_name}`, 'success')
    },
    onError: (err) => toast(err.message ?? 'Exit scan failed', 'error'),
  })
}

export function useActiveVisitors(spaceId) {
  return useQuery({
    queryKey: ['entry', 'active', spaceId],
    queryFn: () => entryService.getActive(spaceId),
    enabled: !!spaceId,
    refetchInterval: 15_000,
    staleTime: 10_000,
    select: (data) => data.visitors ?? [],
  })
}

export function useOccupancy(spaceId) {
  return useQuery({
    queryKey: ['exit', 'occupancy', spaceId],
    queryFn: () => exitService.getOccupancy(spaceId),
    enabled: !!spaceId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}
