'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { firebaseConfig, vapidKey } from '@/lib/firebase'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    // Check initial status
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const subscribe = async () => {
    try {
      setError(null)
      // Modular Firebase imports
      const { initializeApp, getApps } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')
      let app
      if (!getApps().length) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApps()[0]
      }
      const messaging = getMessaging(app)
      const currentToken = await getToken(messaging, { vapidKey })
      setToken(currentToken)
      setPermission(Notification.permission)
      // Send currentToken to your backend to associate with the user
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      })
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to notifications')
    }
  }

  if (!showOfflineMessage && isOnline) {
    return null
  }

  return (
    <div>
      <Alert variant={isOnline ? 'default' : 'destructive'} className="mb-4">
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription className="flex items-center justify-between">
          <span>
            {isOnline
              ? 'Connection restored! You may need to refresh the page.'
              : 'You appear to be offline. Some features may not work properly.'}
          </span>
          {isOnline && (
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </AlertDescription>
      </Alert>
      <div className="my-4">
        <div className="mb-2">
          Push Notifications: <b>{permission}</b>
        </div>
        <Button onClick={subscribe} disabled={permission === 'granted'}>
          {permission === 'granted' ? 'Subscribed' : 'Enable Notifications'}
        </Button>
        {token && <div className="text-xs mt-2 break-all">Token: {token}</div>}
        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  )
}
