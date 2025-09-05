import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const user_id = url.searchParams.get('user_id')
  const entity = url.searchParams.get('entity')
  const action = url.searchParams.get('action')
  const tenant_id = url.searchParams.get('tenant_id')
  const date_from = url.searchParams.get('date_from')
  const date_to = url.searchParams.get('date_to')

  let query = supabase.from('audit_logs').select('*')
  if (user_id) query = query.eq('user_id', user_id)
  if (entity) query = query.eq('entity', entity)
  if (action) query = query.eq('action', action)
  if (tenant_id) query = query.eq('tenant_id', tenant_id)
  if (date_from) query = query.gte('created_at', date_from)
  if (date_to) query = query.lte('created_at', date_to)
  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = ['Date', 'User', 'Action', 'Entity', 'Entity ID', 'Details', 'IP', 'User Agent']
  const rows = (data || []).map(log => [
    log.created_at,
    log.user_id,
    log.action,
    log.entity,
    log.entity_id,
    JSON.stringify(log.details),
    log.ip_address || '',
    log.user_agent || '',
  ])
  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="audit-logs.csv"',
    },
  })
}
