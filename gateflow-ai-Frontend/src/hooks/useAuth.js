/**
 * useAuth.js — Authentication hook.
 * Wraps authService + authStore for components.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import authService from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toast'

const ROLE_HOME = {
  ORGANIZER: '/dashboard',
  RESIDENT: '/dashboard',
  GUARD: '/guard/dashboard',
  RESIDENTIAL_GUARD: '/guard/dashboard',
  ADMIN: '/dashboard',
}

export function useLogin() {
  const { login } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(
        { ...data.user, role: data.role },
        data.access_token,
        data.refresh_token,
      )
      navigate(ROLE_HOME[data.role] ?? '/dashboard')
    },
    onError: (err) => {
      toast(err.message ?? 'Login failed', 'error')
    },
  })
}

export function useRegister() {
  const { login } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      login(
        { ...data.user, role: data.role },
        data.access_token,
        data.refresh_token,
      )
      navigate(ROLE_HOME[data.role] ?? '/dashboard')
    },
    onError: (err) => {
      toast(err.message ?? 'Registration failed', 'error')
    },
  })
}

export function useLogout() {
  const { refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(refreshToken),
    onSettled: () => {
      logout()
      qc.clear()
      navigate('/login')
    },
  })
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    retry: false,
  })
}
