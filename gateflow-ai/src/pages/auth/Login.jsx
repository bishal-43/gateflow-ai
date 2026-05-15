/**
 * Login.jsx — Authentication page.
 *
 * Supports:
 *  - Email + password login (POST /auth/login)
 *  - Google OAuth2 redirect (GET /auth/google)
 *  - Registration (POST /auth/register)
 *
 * Uses React Hook Form + Zod for validation.
 * Auth state managed by useLogin / useRegister hooks → authStore.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLogin, useRegister } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { env } from '@/config/env'
import { MockBanner } from '@/components/ui/MockBanner'
import { Eye, EyeOff, Zap, Lock, Mail, User, Globe } from 'lucide-react'

// ── Validation schemas ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ORGANIZER', 'RESIDENT', 'RESIDENTIAL_GUARD']),
})

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useLogin()
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { role: 'ORGANIZER' },
  })

  const onSubmit = (data) => {
    if (mode === 'login') {
      loginMutation.mutate(data)
    } else {
      const { full_name, email, password, role } = data
      registerMutation.mutate({ full_name, email, password, role })
    }
  }

  const isLoading = loginMutation.isPending || registerMutation.isPending
  const serverError = loginMutation.error?.message || registerMutation.error?.message

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <MockBanner />
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mt-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <Zap className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            GateFlow <span className="text-blue-400">AI</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Smart Temporary Visitor Access & Occupancy Management
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-1 rounded-xl bg-white/5 p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors capitalize ${
                  mode === m
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full name — register only */}
            {mode === 'register' && (
              <div>
                <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    id="full_name"
                    {...register('full_name')}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Account type — must match backend RegisterRequest.role */}
            {mode === 'register' && (
              <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Account type
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full min-h-[44px] rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ORGANIZER">Event organizer</option>
                  <option value="RESIDENT">Resident / owner</option>
                  <option value="RESIDENTIAL_GUARD">Apartment / building security</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-400">{errors.role.message}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  <span className="block">Event gate staff: your organizer sends an invite — </span>
                  <Link to="/register-guard" className="text-blue-400 hover:underline">event guard signup</Link>
                  <span> (needs <code className="text-slate-400">?token=</code> in the link).</span>
                </p>
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400" role="alert">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Google OAuth */}
          <div className="mt-4">
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-slate-500">or</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
            <a
              href={`${env.API_BASE_URL}/auth/google`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              Continue with Google
            </a>
          </div>

          {/* Visitor note */}
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-300 text-center">
              🔗 Visitors access via secure invite link — no login required
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 GateFlow AI — Intelligent Physical Access Operating System
        </p>
      </div>
    </div>
  )
}
