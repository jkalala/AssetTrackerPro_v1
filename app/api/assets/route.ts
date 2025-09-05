import { ratelimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous'
  const { success, limit, remaining, reset } = await ratelimit.limit(ip)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }
  const url = new URL(req.url)
  const fields = url.searchParams
    .get('fields')
    ?.split(',')
    .map(f => f.trim())
    .filter(Boolean) || ['*']
  const dateFrom = url.searchParams.get('dateFrom')
  const dateTo = url.searchParams.get('dateTo')
  const category = url.searchParams.get('category')
  const status = url.searchParams.get('status')
  const supabase = await createClient()
  let query = supabase.from('assets').select(fields.join(','))
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assets: data })
}
