import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, MapPin } from 'lucide-react'

export default function AssetGeofenceEvents({ assetId }: { assetId: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('geofence_events')
        .select('*, geofence:geofence_id(name)')
        .eq('asset_id', assetId)
        .order('timestamp', { ascending: false })
      setEvents(data || [])
      setLoading(false)
    }
    fetchEvents()
  }, [assetId])
  if (loading) return <div>Loading geofence events...</div>
  if (!events.length) return <div>No geofence events for this asset.</div>
  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span>
            <b>{ev.event_type === 'entry' ? 'Entered' : 'Exited'}</b> zone{' '}
            <b>{ev.geofence?.name || ev.geofence_id}</b> at{' '}
            {new Date(ev.timestamp).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}
