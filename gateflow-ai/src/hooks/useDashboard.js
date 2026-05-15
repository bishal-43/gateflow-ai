/**
 * useDashboard.js — Dashboard data hooks.
 * All queries are scoped to a spaceId.
 */

import { useQuery } from '@tanstack/react-query'
import dashboardService from '@/services/dashboardService'

export const DASHBOARD_KEY = (spaceId) => ['dashboard', spaceId]

export function useDashboardStats(spaceId) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY(spaceId), 'stats'],
    queryFn: () => dashboardService.getStats(spaceId),
    enabled: !!spaceId,
    refetchInterval: 30_000, // poll every 30 s as fallback to WS
    staleTime: 15_000,
  })
}

export function useDashboardOccupancy(spaceId) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY(spaceId), 'occupancy'],
    queryFn: () => dashboardService.getOccupancy(spaceId),
    enabled: !!spaceId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
}

export function useDashboardEntries(spaceId, limit = 50) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY(spaceId), 'entries', limit],
    queryFn: () => dashboardService.getEntries(spaceId, limit),
    enabled: !!spaceId,
    refetchInterval: 20_000,
    staleTime: 10_000,
    select: (data) => data.entries ?? [],
  })
}

export function useDashboardWalkins(spaceId) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY(spaceId), 'walkins'],
    queryFn: () => dashboardService.getWalkins(spaceId),
    enabled: !!spaceId,
    refetchInterval: 20_000,
    staleTime: 10_000,
    select: (data) => data.requests ?? [],
  })
}

export function useDashboardOverstays(spaceId) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY(spaceId), 'overstays'],
    queryFn: () => dashboardService.getOverstays(spaceId),
    enabled: !!spaceId,
    refetchInterval: 60_000,
    staleTime: 30_000,
    select: (data) => data.sessions ?? [],
  })
}
