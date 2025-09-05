import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateBookValue } from '@/lib/asset-depreciation'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: { assetId: string } }) {
  try {
    const supabase = await createClient()
    const assetId = params.assetId
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('asset_id', assetId)
      .single()
    if (error || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    const bookValue = calculateBookValue({
      purchase_value: Number(asset.purchase_value),
      purchase_date: asset.purchase_date,
      depreciation_method: asset.depreciation_method,
      depreciation_period_years: asset.depreciation_period_years,
      salvage_value: Number(asset.salvage_value) || 0,
    })
    return NextResponse.json({ success: true, bookValue })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
