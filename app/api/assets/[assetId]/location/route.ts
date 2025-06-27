import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET: Get asset location
export async function GET(request: Request, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { data: asset, error } = await supabase
    .from('assets')
    .select('id, location_text, location_lat, location_lng, location_source, location_updated_at')
    .eq('asset_id', assetId)
    .single()
  if (error || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }
  return NextResponse.json({ location: asset })
}

// PUT: Update asset location
export async function PUT(request: Request, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { location_text, location_lat, location_lng, location_source } = body
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('id')
    .eq('asset_id', assetId)
    .single()
  if (fetchError || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  // Fetch current location before update
  const { data: prevAsset, error: prevError } = await supabase
    .from('assets')
    .select('location_text, location_lat, location_lng')
    .eq('id', asset.id)
    .single()
  const { error: updateError, data: updated } = await supabase
    .from('assets')
    .update({
      location_text,
      location_lat,
      location_lng,
      location_source,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', asset.id)
    .select('id, location_text, location_lat, location_lng, location_source, location_updated_at')
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  // Log to location history
  await supabase.from('asset_location_history').insert({
    asset_id: asset.id,
    location_text,
    location_lat,
    location_lng,
    location_source,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
    prev_location_text: prevAsset?.location_text ?? null,
    prev_location_lat: prevAsset?.location_lat ?? null,
    prev_location_lng: prevAsset?.location_lng ?? null,
  })
  return NextResponse.json({ location: updated })
} 