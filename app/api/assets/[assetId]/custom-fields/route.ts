import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  // Get all custom field values for this asset, joined with field definitions
  const { data, error } = await supabase
    .from('asset_custom_field_values')
    .select('id, field_id, value, asset_id, asset_field_definitions:field_id(*)')
    .eq('asset_id', assetId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { values } = await req.json() // expects: { values: [{ field_id, value }] }
  let errorMsg = null
  for (const { field_id, value } of values) {
    const { error } = await supabase
      .from('asset_custom_field_values')
      .upsert(
        { asset_id: assetId, field_id, value, updated_at: new Date().toISOString() },
        { onConflict: 'asset_id,field_id' }
      )
    if (error) errorMsg = error.message
  }
  if (errorMsg) return NextResponse.json({ error: errorMsg }, { status: 500 })
  return NextResponse.json({ success: true })
}
