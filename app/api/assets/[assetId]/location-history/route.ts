import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: { assetId: string } }) {
  const supabase = await createClient()
  const assetId = params.assetId
  const { data, error } = await supabase
    .from('asset_location_history')
    .select('*, updated_by_profile:updated_by(full_name)')
    .eq('asset_id', assetId)
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ history: data })
} 