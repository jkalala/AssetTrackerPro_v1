import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('asset_lifecycle_rules')
    .select('*, asset:asset_id(name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Add asset_name for convenience
  const withAssetName = (data || []).map((r: any) => ({ ...r, asset_name: r.asset?.name }))
  return NextResponse.json({ data: withAssetName })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { asset_id, type, trigger_field, interval, trigger_date, status } = await req.json()
  const { data, error } = await supabase
    .from('asset_lifecycle_rules')
    .insert({ asset_id: asset_id || null, type, trigger_field, interval, trigger_date, status })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { id, asset_id, type, trigger_field, interval, trigger_date, status } = await req.json()
  const { data, error } = await supabase
    .from('asset_lifecycle_rules')
    .update({
      asset_id: asset_id || null,
      type,
      trigger_field,
      interval,
      trigger_date,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id } = await req.json()
  const { error } = await supabase.from('asset_lifecycle_rules').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
