/**
 * SpaceGuards.jsx — Invite / list / remove guards for one space (organizer flow).
 */

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState, EmptyState } from '@/components/ui/ErrorState'
import spaceService from '@/services/spaceService'
import { useSpace } from '@/hooks/useSpaces'
import { toast } from '@/components/ui/Toast'
import { ArrowLeft, Shield, Mail, UserMinus, Copy, Check } from 'lucide-react'

export default function SpaceGuards() {
  const { spaceId } = useParams()
  const qc = useQueryClient()
  const { data: space, isLoading: spaceLoading, error: spaceError } = useSpace(spaceId)
  const [email, setEmail] = useState('')
  const [lastInviteLink, setLastInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const guardsQuery = useQuery({
    queryKey: ['spaces', spaceId, 'guards'],
    queryFn: () => spaceService.listGuards(spaceId),
    enabled: !!spaceId,
    staleTime: 30_000,
  })

  const inviteMut = useMutation({
    mutationFn: () => spaceService.inviteGuard(spaceId, email.trim()),
    onSuccess: (data) => {
      setLastInviteLink(data.invite_link)
      setEmail('')
      toast('Invite link ready — copy and send it to your guard.', 'success')
      // Invalidate so the list refreshes once the guard registers via the link
      qc.invalidateQueries({ queryKey: ['spaces', spaceId, 'guards'] })
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const addMut = useMutation({
    mutationFn: () => spaceService.addGuard(spaceId, email.trim()),
    onSuccess: () => {
      setEmail('')
      toast('Guard added to this space.', 'success')
      qc.invalidateQueries({ queryKey: ['spaces', spaceId, 'guards'] })
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const removeMut = useMutation({
    mutationFn: (guardUserId) => spaceService.removeGuard(spaceId, guardUserId),
    onSuccess: () => {
      toast('Guard removed', 'info')
      qc.invalidateQueries({ queryKey: ['spaces', spaceId, 'guards'] })
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const copyLink = async () => {
    if (!lastInviteLink) return
    try {
      await navigator.clipboard.writeText(lastInviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Could not copy — select the link manually.', 'error')
    }
  }

  if (spaceLoading) {
    return (
      <DashboardLayout title="Guards" subtitle="Loading…">
        <div className="animate-pulse h-32 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </DashboardLayout>
    )
  }

  if (spaceError || !space) {
    return (
      <DashboardLayout title="Guards" subtitle="Space">
        {spaceError ? (
          <ErrorState error={spaceError} title="Space not found" />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Space not found.</p>
        )}
        <Link to="/spaces" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to spaces
        </Link>
      </DashboardLayout>
    )
  }

  const guards = guardsQuery.data?.guards ?? []
  const isEvent = space.type === 'EVENT'

  return (
    <DashboardLayout title="Guards" subtitle={space.name}>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/spaces" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All spaces
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" aria-hidden />
              Add guards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEvent ? (
                <>
                  For <strong>events</strong>, you can email an invite link (new event guard account) or add someone who already has an <strong>event guard</strong> login.
                </>
              ) : (
                <>
                  For <strong>apartments</strong>, security staff register as &quot;Apartment / building security&quot;, then you add their email here. Invite links are not used for residential spaces.
                </>
              )}
            </p>
            <div>
              <label htmlFor="guard-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="guard-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEvent ? 'guard@example.com' : 'security@building.com'}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isEvent && (
                <Button
                  type="button"
                  className="sm:flex-1"
                  disabled={!email.trim() || inviteMut.isPending}
                  onClick={() => inviteMut.mutate()}
                >
                  <Mail className="h-4 w-4 mr-2" aria-hidden />
                  {inviteMut.isPending ? 'Creating…' : 'Create invite link'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="sm:flex-1"
                disabled={!email.trim() || addMut.isPending}
                onClick={() => addMut.mutate()}
              >
                {addMut.isPending ? 'Adding…' : 'Add existing account'}
              </Button>
            </div>
            {isEvent && lastInviteLink && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">Latest invite link</p>
                <p className="text-xs break-all text-gray-800 dark:text-gray-200 mb-2">{lastInviteLink}</p>
                <Button type="button" size="sm" variant="outline" onClick={copyLink}>
                  {copied ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned guards ({guards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {guardsQuery.isLoading ? (
              <p className="text-sm text-gray-500">Loading list…</p>
            ) : guardsQuery.isError ? (
              <ErrorState error={guardsQuery.error} onRetry={() => guardsQuery.refetch()} title="Could not load guards" />
            ) : guards.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No guards yet"
                description={isEvent ? 'Create an invite link or add an existing event guard account.' : 'Add the email of someone who registered as apartment security.'}
              />
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {guards.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{g.full_name}</p>
                      <p className="text-sm text-gray-500 truncate">{g.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/50"
                      disabled={removeMut.isPending}
                      onClick={() => {
                        if (window.confirm(`Remove ${g.full_name} from this space?`)) removeMut.mutate(g.id)
                      }}
                    >
                      <UserMinus className="h-4 w-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
