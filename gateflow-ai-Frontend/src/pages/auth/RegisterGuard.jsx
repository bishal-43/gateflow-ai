/**
 * RegisterGuard.jsx — Guard signup using organizer invite (?token=JWT).
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import authService from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { MockBanner } from '@/components/ui/MockBanner'
import { Eye, EyeOff, Zap, Lock, Mail, User } from 'lucide-react'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function RegisterGuard() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)

  const preview = useQuery({
    queryKey: ['guard-invite-preview', token],
    queryFn: () => authService.previewGuardInvite(token),
    enabled: token.length >= 10,
    retry: false,
  })

  const registerMut = useMutation({
    mutationFn: (body) => authService.registerGuard(body),
    onSuccess: (data) => {
      login(data.user, data.access_token, data.refresh_token)
      navigate('/guard/dashboard', { replace: true })
    },
  })

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '' },
  })

  useEffect(() => {
    if (preview.data?.email) setValue('email', preview.data.email)
  }, [preview.data?.email, setValue])

  const onSubmit = (data) => {
    if (!token) return
    registerMut.mutate({ token, ...data })
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-center text-slate-300">
        <p>
          Missing invite token. Open the full link your organizer sent you, or{' '}
          <Link className="text-blue-400 underline" to="/login">go to login</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <MockBanner />
      <div className="relative w-full max-w-md mt-4">
        <div className="mb-6 text-center text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 mb-3">
            <Zap className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold">Join as guard</h1>
          {preview.isLoading && <p className="text-sm text-slate-400 mt-2">Checking invite…</p>}
          {preview.data && (
            <p className="text-sm text-slate-300 mt-2">
              Space: <span className="font-semibold text-white">{preview.data.space_name}</span>
            </p>
          )}
          {preview.isError && (
            <p className="text-sm text-red-400 mt-2">Invalid or expired invite link.</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 space-y-4">
          <div>
            <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="full_name"
                {...register('full_name')}
                className="w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                placeholder="Your name"
              />
            </div>
            {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email (must match invite)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                readOnly={!!preview.data?.email}
                {...register('email')}
                className="w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 read-only:opacity-90"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          {registerMut.error && (
            <p className="text-sm text-red-400" role="alert">{registerMut.error.message}</p>
          )}
          <Button
            type="submit"
            className="w-full h-11"
            disabled={registerMut.isPending || preview.isError || !preview.data}
          >
            {registerMut.isPending ? 'Creating…' : 'Create guard account'}
          </Button>
          <p className="text-center text-xs text-slate-500">
            <Link to="/login" className="text-blue-400 hover:underline">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
