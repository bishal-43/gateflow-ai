/**
 * ExitScan.jsx — Guard exit scanning page (Redesigned for Phase 2).
 *
 * API: POST /exit/scan → { qr_token, gate_id }
 * Response: ExitScanResponse { status, visitor_name, session_id, exit_time }
 *
 * Roles: GUARD | ADMIN
 */

import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ActionCard } from '@/components/ui/ActionCard'
import { Badge } from '@/components/ui/Badge'
import { useExitScan } from '@/hooks/useEntry'
import { friendlyScanError } from '@/lib/scanMessages'
import { cn, formatDateTime } from '@/lib/utils'
import { CheckCircle, XCircle, Camera, CameraOff, DoorClosed, RefreshCw } from 'lucide-react'

export default function ExitScan() {
  const exitScan = useExitScan()
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [selectedGate, setSelectedGate] = useState('EXIT_GATE_1')
  const [scanHistory, setScanHistory] = useState([])
  const [cameraError, setCameraError] = useState(false)
  const html5QrRef = useRef(null)

  const processQR = (qrToken) => {
    exitScan.mutate(
      { qr_token: qrToken, gate_id: selectedGate },
      {
        onSuccess: (data) => {
          const entry = { id: Date.now(), qrToken, type: 'success', data, timestamp: new Date().toISOString() }
          setScanResult(entry)
          setScanHistory((prev) => [entry, ...prev.slice(0, 9)])
          setTimeout(() => setScanResult(null), 3000)
        },
        onError: (err) => {
          const entry = { id: Date.now(), qrToken, type: 'error', error: err, timestamp: new Date().toISOString() }
          setScanResult(entry)
          setScanHistory((prev) => [entry, ...prev.slice(0, 9)])
          setTimeout(() => setScanResult(null), 5500)
        },
      },
    )
  }

  const startScanner = async () => {
    setScanning(true)
    setCameraError(false)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      html5QrRef.current = new Html5Qrcode('qr-reader-exit')
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { processQR(decoded); stopScanner() },
        () => {},
      )
    } catch {
      setCameraError(true)
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); html5QrRef.current.clear() } catch {}
    }
    setScanning(false)
  }

  useEffect(() => () => { stopScanner() }, [])

  return (
    <DashboardLayout title="Exit scan" subtitle="Scan the guest QR — records exit at the gate you pick">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Scan Result - Large Visual Feedback */}
        {scanResult && (
          <div
            className={cn(
              'rounded-2xl border-4 p-8 sm:p-12 text-center',
              scanResult.type === 'success'
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-red-400 bg-red-50 dark:bg-red-900/20'
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex justify-center mb-4">
              {scanResult.type === 'success' ? (
                <CheckCircle className="h-20 w-20 text-blue-600 dark:text-blue-400" />
              ) : (
                <XCircle className="h-20 w-20 text-red-600 dark:text-red-400" />
              )}
            </div>

            <h2 className={cn(
              'text-3xl sm:text-4xl font-black tracking-tight mb-2',
              scanResult.type === 'success'
                ? 'text-blue-700 dark:text-blue-200'
                : 'text-red-700 dark:text-red-200'
            )}>
              {scanResult.type === 'success' ? '✓ EXIT RECORDED' : '✗ EXIT FAILED'}
            </h2>

            {scanResult.type === 'success' && scanResult.data && (
              <div className="mt-6 space-y-3">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scanResult.data.visitor_name}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  👋 Departed at {selectedGate.replace('_', ' ')}
                </p>
                {scanResult.data.exit_time && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Time: {formatDateTime(scanResult.data.exit_time)}
                  </p>
                )}
              </div>
            )}

            {scanResult.type === 'error' && (
              <p className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-4 max-w-lg mx-auto leading-snug">
                {friendlyScanError(scanResult.error?.message)}
              </p>
            )}
          </div>
        )}

        {/* Gate — large touch target */}
        <div className="mx-auto max-w-xl rounded-2xl border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <label htmlFor="gate-select-exit" className="mb-2 block text-base font-semibold text-gray-900 dark:text-gray-100">
            Which exit are you at?
          </label>
          <select
            id="gate-select-exit"
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="w-full min-h-[52px] rounded-xl border-2 border-gray-300 bg-white px-4 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {['EXIT_GATE_1', 'EXIT_GATE_2', 'EXIT_GATE_3', 'BACK_GATE'].map((g) => (
              <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Camera View */}
        {!scanResult ? (
          <div className="space-y-4">
            {/* Large QR Scanner Area */}
            <div className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-square max-h-96 flex items-center justify-center shadow-lg">
              {scanning ? (
                <>
                  <div id="qr-reader-exit" className="w-full h-full" />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-56 border-4 border-red-400 rounded-2xl">
                      {['tl', 'tr', 'bl', 'br'].map((corner) => (
                        <div key={corner} className={cn(
                          'absolute h-8 w-8 border-4 border-red-400',
                          corner === 'tl' && 'top-0 left-0 border-t border-l rounded-tl-lg',
                          corner === 'tr' && 'top-0 right-0 border-t border-r rounded-tr-lg',
                          corner === 'bl' && 'bottom-0 left-0 border-b border-l rounded-bl-lg',
                          corner === 'br' && 'bottom-0 right-0 border-b border-r rounded-br-lg',
                        )} />
                      ))}
                    </div>
                  </div>
                </>
              ) : cameraError ? (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                  <CameraOff className="h-24 w-24" />
                  <p className="text-xl font-bold">Camera Unavailable</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                  <DoorClosed className="h-24 w-24" aria-hidden />
                  <p className="text-xl font-bold">Ready — tap button below</p>
                </div>
              )}
            </div>

            {/* Scan Button - Large Action Card */}
            <ActionCard
              icon={scanning ? RefreshCw : Camera}
              title={scanning ? 'Stop Scanner' : 'Start Camera'}
              subtitle={scanning ? 'Point camera at QR code' : 'Tap to begin scanning'}
              variant={scanning ? 'secondary' : 'destructive'}
              size="lg"
              loading={scanning}
              onClick={scanning ? stopScanner : startScanner}
            />
          </div>
        ) : null}

        {/* Scan History */}
        {scanHistory.length > 0 && !scanResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Exits ({scanHistory.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scanHistory.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4 border-2',
                      entry.type === 'success'
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {entry.data?.visitor_name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant={entry.type === 'success' ? 'success' : 'destructive'} title={entry.type === 'error' ? friendlyScanError(entry.error?.message) : undefined}>
                      {entry.type === 'success' ? '✓ OK' : '✗ FAILED'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  )
}
