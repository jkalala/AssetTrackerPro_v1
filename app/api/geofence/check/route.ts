import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function pointInPolygon(point: [number, number], polygon: [number, number][][]): boolean {
  // Ray-casting algorithm for detecting if point is in polygon
  const [x, y] = point
  let inside = false
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1]
      const xj = ring[j][0], yj = ring[j][1]
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi)
      if (intersect) inside = !inside
    }
  }
  return inside
}

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { lat, lng } = await req.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }
  // Fetch all geofence zones
  const { data: zones, error } = await supabase
    .from('geofence_zones')
    .select('id, name, polygon, description')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Check if point is in any polygon
  const matches = (zones || []).filter(zone => {
    if (!zone.polygon || !Array.isArray(zone.polygon.coordinates)) return false
    return pointInPolygon([lng, lat], zone.polygon.coordinates)
  })
  return NextResponse.json({ matches })
} 