/**
 * useVisitor.js — Visitor token-based session hooks.
 * No JWT — uses invite token from URL.
 */

import { useQuery } from '@tanstack/react-query'
import visitorService from '@/services/visitorService'

export function useOpenInvite(token) {
  return useQuery({
    queryKey: ['visitor', 'invite', token],
    queryFn: () => visitorService.openInvite(token),
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}

export function useVisitorDetails(token) {
  return useQuery({
    queryKey: ['visitor', 'details', token],
    queryFn: () => visitorService.getDetails(token),
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}

export function useVisitorQR(token) {
  return useQuery({
    queryKey: ['visitor', 'qr', token],
    queryFn: () => visitorService.getQR(token),
    enabled: !!token,
    staleTime: 60_000,
    retry: 1,
  })
}
