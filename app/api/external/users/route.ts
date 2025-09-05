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
    await logApiUsage({ api_key_id: '', endpoint: '/api/external/users', status: 401 })
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
  }
  const { valid, tenant_id, api_key_id } = await validateApiKey(apiKey)
  if (!valid || !tenant_id) {
    await logApiUsage({
      api_key_id: api_key_id || '',
      endpoint: '/api/external/users',
      status: 401,
    })
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }
  const supabase = await createClient()
  // Assuming profiles table has tenant_id
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })

  if (error) {
    await logApiUsage({
      api_key_id: api_key_id || '',
      endpoint: '/api/external/users',
      status: 500,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/users', status: 200 })
  return NextResponse.json({ data })
}
