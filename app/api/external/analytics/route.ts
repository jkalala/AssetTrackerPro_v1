import { validateApiKey } from '@/lib/api-key'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/with-rate-limit'
import { logApiUsage } from '@/lib/api-usage'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const apiKey = authHeader.replace('Bearer ', '').trim()
  // Rate limit by API key or IP
  const rateLimitError = await withRateLimit(request, { limit: 60, window: '1m' })
  if (rateLimitError) return rateLimitError
  if (!apiKey) {
    await logApiUsage({ api_key_id: '', endpoint: '/api/external/analytics', status: 401 })
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }
  const { valid, tenant_id, api_key_id } = await validateApiKey(apiKey)
  if (!valid || !tenant_id) {
    await logApiUsage({
      api_key_id: api_key_id || '',
      endpoint: '/api/external/analytics',
      status: 401,
    })
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('features')
    .eq('id', tenant_id)
    .single()
  if (!tenant?.features?.analytics) {
    await logApiUsage({
      api_key_id: api_key_id || '',
      endpoint: '/api/external/analytics',
      status: 403,
    })
    return NextResponse.json({ error: 'Analytics not enabled for this tenant' }, { status: 403 })
  }
  const { count: assetCount } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
  const { data: recentAssets } = await supabase
    .from('assets')
    .select('asset_id, name, created_at')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(5)
  await logApiUsage({
    api_key_id: api_key_id || '',
    endpoint: '/api/external/analytics',
    status: 200,
  })
  return NextResponse.json({
    totalAssets: assetCount || 0,
    totalUsers: userCount || 0,
    recentAssets: recentAssets || [],
  })
}
