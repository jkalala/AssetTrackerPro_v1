// Geofence Event Detector Script
// Run this script on a schedule to log geofence entry/exit events for all assets

import { createClient } from '../lib/supabase/server'

function pointInPolygon(point: [number, number], polygon: [number, number][][]): boolean {
  // Ray-casting algorithm for detecting if point is in polygon
  const [x, y] = point
  let inside = false
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0],
        yi = ring[i][1]
      const xj = ring[j][0],
        yj = ring[j][1]
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi
      if (intersect) inside = !inside
    }
  }
  return inside
}

async function main() {
  const supabase = await createClient()

  // Fetch all assets with location
  const { data: assets, error: assetError } = await supabase
    .from('assets')
    .select('id, asset_id, name, category, location_lat, location_lng')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)

  if (assetError) {
    console.error('Failed to fetch assets:', assetError)
    return
  }

  // Fetch all geofences
  const { data: geofences, error: geofenceError } = await supabase
    .from('geofence_zones')
    .select('id, name, polygon')

  if (geofenceError) {
    console.error('Failed to fetch geofences:', geofenceError)
    return
  }

  // Fetch recent geofence events (last 1 hour) to avoid duplicate logging
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recentEvents } = await supabase
    .from('geofence_events')
    .select('asset_id, geofence_id, event_type, timestamp')
    .gte('timestamp', since)

  // Fetch all geofence rules (active)
  const { data: rules, error: rulesError } = await supabase
    .from('geofence_rules')
    .select('*')
    .eq('is_active', true)
  if (rulesError) {
    console.error('Failed to fetch geofence rules:', rulesError)
    return
  }

  // For each asset, check which geofences it is inside
  for (const asset of assets) {
    const lat = asset.location_lat
    const lng = asset.location_lng
    if (lat == null || lng == null) continue
    const insideZones = geofences.filter(zone => {
      if (!zone.polygon || !Array.isArray(zone.polygon.coordinates)) return false
      return pointInPolygon([lng, lat], zone.polygon.coordinates)
    })
    // For each geofence, check if an entry/exit event needs to be logged
    for (const zone of geofences) {
      const wasInside = recentEvents?.some(
        ev => ev.asset_id === asset.id && ev.geofence_id === zone.id && ev.event_type === 'entry'
      )
      const isInside = insideZones.some(z => z.id === zone.id)
      // Find matching rules for this asset/zone
      const matchingRules = rules.filter(
        rule =>
          rule.geofence_id === zone.id &&
          (rule.asset_id ? rule.asset_id === asset.id : true) &&
          (rule.category ? rule.category === asset.category : true)
      )
      if (isInside && !wasInside) {
        // Log entry event
        await supabase.from('geofence_events').insert({
          asset_id: asset.id,
          geofence_id: zone.id,
          event_type: 'entry',
        })
        console.log(`Asset ${asset.asset_id} entered geofence ${zone.name}`)
        // Check for entry rules
        for (const rule of matchingRules.filter(r => r.trigger_event === 'entry')) {
          // Trigger notification (replace with real notification util if available)
          if (rule.notify_in_app)
            console.log(
              `[IN-APP] Geofence rule triggered: Asset ${asset.asset_id} entered ${zone.name} (Escalation: ${rule.escalation_level})`
            )
          if (rule.notify_email)
            console.log(
              `[EMAIL] Geofence rule triggered: Asset ${asset.asset_id} entered ${zone.name} (Escalation: ${rule.escalation_level})`
            )
        }
      } else if (!isInside && wasInside) {
        // Log exit event
        await supabase.from('geofence_events').insert({
          asset_id: asset.id,
          geofence_id: zone.id,
          event_type: 'exit',
        })
        console.log(`Asset ${asset.asset_id} exited geofence ${zone.name}`)
        // Check for exit rules
        for (const rule of matchingRules.filter(r => r.trigger_event === 'exit')) {
          // For min_duration, you would check the last entry event timestamp and compare
          // For now, just trigger notification
          if (rule.notify_in_app)
            console.log(
              `[IN-APP] Geofence rule triggered: Asset ${asset.asset_id} exited ${zone.name} (Escalation: ${rule.escalation_level})`
            )
          if (rule.notify_email)
            console.log(
              `[EMAIL] Geofence rule triggered: Asset ${asset.asset_id} exited ${zone.name} (Escalation: ${rule.escalation_level})`
            )
        }
      }
    }
  }
}

main().catch(console.error)
