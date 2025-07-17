// Notification utility for geofence events
import { createClient } from './supabase/server'

export async function sendGeofenceEventNotification(userId: string, asset: any, geofence: any, eventType: 'entry' | 'exit') {
  const supabase = await createClient()
  // In-app notification (insert into notifications table)
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `Asset ${asset.name} ${eventType === 'entry' ? 'entered' : 'exited'} geofence`,
    body: `Asset ${asset.name} (${asset.asset_id}) ${eventType === 'entry' ? 'entered' : 'exited'} zone: ${geofence.name}`,
    type: 'geofence',
    data: { asset_id: asset.id, geofence_id: geofence.id, event_type: eventType },
    read: false
  })
  // (Optional) Email notification logic can be added here
} 