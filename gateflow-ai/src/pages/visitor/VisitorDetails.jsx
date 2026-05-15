/**
 * VisitorDetails.jsx — Invite and space information from the backend only.
 *
 * API: GET /visitor/details/:token → VisitorDetailsResponse
 * (schemas/visitor.py — no schedule or amenities; only invite + space fields.)
 */

import { Link } from 'react-router-dom'
import { VisitorLayout } from '@/components/layout/VisitorLayout'
import { useVisitorSessionStore } from '@/store/visitorSessionStore'
import { useVisitorDetails } from '@/hooks/useVisitor'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatDateTime } from '@/lib/utils'
import { Calendar, MapPin, Clock, Ticket, Mail, Link2 } from 'lucide-react'

function formatInviteType(type) {
  if (!type) return 'Invite'
  return String(type).replace(/_/g, ' ')
}

export default function VisitorDetails() {
  const inviteToken = useVisitorSessionStore((s) => s.inviteToken)
  const { data, isLoading, isFetching, error, refetch } = useVisitorDetails(inviteToken)

  if (!inviteToken) {
    return (
      <VisitorLayout title="Details">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <Link2 className="h-10 w-10 mx-auto text-gray-400" aria-hidden="true" />
            <p className="text-gray-900 dark:text-white font-medium">No visitor session</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Open your invite link from email or SMS first, then use <strong>Details</strong> from the bottom menu.
            </p>
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Staff login
            </Link>
          </CardContent>
        </Card>
      </VisitorLayout>
    )
  }

  if (isLoading && !data) {
    return (
      <VisitorLayout title="Details">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </VisitorLayout>
    )
  }

  if (error) {
    return (
      <VisitorLayout title="Details">
        <ErrorState error={error} onRetry={() => refetch()} title="Could not load details" />
      </VisitorLayout>
    )
  }

  if (!data) return null

  const { space } = data

  return (
    <VisitorLayout title="Details">
      {isFetching && !isLoading && (
        <p className="mb-3 text-center text-xs text-gray-500" aria-live="polite">
          Refreshing…
        </p>
      )}
      <div className="space-y-5">
        <div className="rounded-2xl bg-blue-700 p-5 text-white">
          <Badge className="mb-3 border-white/30 bg-white/20 text-white">
            {space?.type ?? '—'}
          </Badge>
          <h2 className="text-xl font-bold">{space?.name ?? '—'}</h2>
          <div className="mt-3 space-y-2 text-base text-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden />
              <span>Valid {formatDateTime(data.valid_from)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <span>Until {formatDateTime(data.valid_until)}</span>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Ticket className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              Your invite
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{data.visitor_name}</dd>
              </div>
              {data.visitor_email && (
                <div className="flex justify-between gap-4">
                  <dt className="flex items-center gap-1 text-gray-500">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Email
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{data.visitor_email}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatInviteType(data.invite_type)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge variant="secondary">{data.status}</Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              Location
            </h3>
            <dl className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {space?.venue && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">Venue</dt>
                  <dd className="mt-0.5 text-base font-medium text-gray-900 dark:text-white">{space.venue}</dd>
                </div>
              )}
              {space?.address && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">Address</dt>
                  <dd className="mt-0.5">{space.address}</dd>
                </div>
              )}
              {space?.start_time && (
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">Starts</dt>
                    <dd className="mt-0.5">{formatDateTime(space.start_time)}</dd>
                  </div>
                </div>
              )}
              {space?.end_time && (
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">Ends</dt>
                    <dd className="mt-0.5">{formatDateTime(space.end_time)}</dd>
                  </div>
                </div>
              )}
              {!space?.venue && !space?.address && !space?.start_time && !space?.end_time && (
                <p className="text-gray-500">No extra location details from the organizer.</p>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </VisitorLayout>
  )
}
