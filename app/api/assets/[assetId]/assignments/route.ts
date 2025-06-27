import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: { assetId: string } }) {
  try {
    const supabase = await createClient()
    const assetId = params.assetId
    // Fetch assignment history for the asset
    const { data, error } = await supabase
      .from('asset_assignments')
      .select('*, assignee:assignee_id(full_name), assigned_by_profile:assigned_by(full_name)')
      .eq('asset_id', assetId)
      .order('checked_out_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch assignment history: ' + error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, assignments: data })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 