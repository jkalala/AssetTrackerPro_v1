import React, { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function AssetGeofenceStatus({ lat, lng }: { lat: number | null, lng: number | null }) {
  const [status, setStatus] = useState<'inside' | 'outside' | 'unknown'>('unknown')
  const [zones, setZones] = useState<any[]>([])
  useEffect(() => {
    if (lat && lng) {
      fetch('/api/geofence/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      })
        .then(res => res.json())
        .then(data => {
          if (data.matches && data.matches.length > 0) {
            setStatus('inside')
            setZones(data.matches)
          } else {
            setStatus('outside')
            setZones([])
          }
        })
    } else {
      setStatus('unknown')
      setZones([])
    }
  }, [lat, lng])
  if (status === 'unknown') return null
  return status === 'inside' ? (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription>
        Asset is <strong>inside</strong> geofence zone{zones.length > 1 ? 's' : ''}: {zones.map(z => z.name).join(', ')}
      </AlertDescription>
    </Alert>
  ) : (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Asset is <strong>outside</strong> all geofence zones!
      </AlertDescription>
    </Alert>
  )
} 