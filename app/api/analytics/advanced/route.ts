import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { dateFrom, dateTo, category, status } = await request.json()

  let query = supabase.from('assets').select('status, category, purchase_value, created_at')
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Aggregate for charts
  const byStatus: { [key: string]: number } = {}
  const byCategory: { [key: string]: number } = {}
  let totalValue = 0
  ;(data || []).forEach((asset: { status: string; category: string; purchase_value?: number }) => {
    byStatus[asset.status] = (byStatus[asset.status] || 0) + 1
    byCategory[asset.category] = (byCategory[asset.category] || 0) + 1
    if (asset.purchase_value) totalValue += asset.purchase_value
  })

  return NextResponse.json({
    data: {
      assets: data,
      byStatus,
      byCategory,
      totalValue,
      total: data.length,
    },
  })
}
