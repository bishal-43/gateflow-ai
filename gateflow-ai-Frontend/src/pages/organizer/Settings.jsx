import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toast'
import { User, Bell, Shield, Save } from 'lucide-react'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
  })
  const [notifications, setNotifications] = useState({
    walkinRequests: true,
    urgentAlerts: true,
    suspiciousActivity: true,
    emailNotifications: false,
    smsNotifications: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setProfile((p) => ({
      ...p,
      name: user.full_name ?? user.name ?? '',
      email: user.email ?? '',
    }))
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    updateUser({ full_name: profile.name, name: profile.name, email: profile.email })
    toast('Profile updated successfully', 'success')
    setSaving(false)
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    toast('Notification preferences saved', 'success')
    setSaving(false)
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-blue-400" aria-hidden="true" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settingsName" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Full name
                  </label>
                  <Input
                    id="settingsName"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="settingsEmail" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <Input
                    id="settingsEmail"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="settingsPhone" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Phone
                  </label>
                  <Input
                    id="settingsPhone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 …"
                  />
                </div>
                <div>
                  <label htmlFor="settingsOrg" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Organization
                  </label>
                  <Input
                    id="settingsOrg"
                    value={profile.organization}
                    onChange={(e) => setProfile((p) => ({ ...p, organization: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-amber-400" aria-hidden="true" />
              Notification preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-gray-500">
              Stored on this device for this session. In-app alerts still use the bell in the top bar.
            </p>
            <div className="space-y-4">
              {[
                { key: 'walkinRequests', label: 'Walk-in requests', desc: 'When a guard submits a walk-in for your space' },
                { key: 'urgentAlerts', label: 'Urgent alerts', desc: 'Emergency and high-priority access notices' },
                { key: 'suspiciousActivity', label: 'Security alerts', desc: 'Duplicate QR attempts and similar signals' },
                { key: 'emailNotifications', label: 'Email', desc: 'Email delivery (when connected)' },
                { key: 'smsNotifications', label: 'SMS', desc: 'SMS delivery (when connected)' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-100">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[item.key]}
                    onClick={() => setNotifications((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                      notifications[item.key] ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
              <Button onClick={handleSaveNotifications} variant="outline" disabled={saving} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gray-300">
              Password changes and two-factor authentication are not wired in this MVP build. Use your workspace
              administrator or deployment support if you need account recovery or a password reset.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
