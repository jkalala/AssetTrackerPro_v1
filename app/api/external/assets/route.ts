import { validateApiKey } from '@/lib/api-key';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { logApiUsage } from '@/lib/api-usage';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const apiKey = authHeader.replace('Bearer ', '').trim();
  // Rate limit by API key or IP
  const rateLimitError = await withRateLimit(request, { limit: 60, window: '1m' });
  if (rateLimitError) return rateLimitError;
  if (!apiKey) {
    await logApiUsage({ api_key_id: '', endpoint: '/api/external/assets', status: 401 });
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }
  const { valid, tenant_id, api_key_id } = await validateApiKey(apiKey);
  if (!valid || !tenant_id) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 401 });
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });
  if (error) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 500 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 200 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const apiKey = authHeader.replace('Bearer ', '').trim();
  // Rate limit by API key or IP
  const rateLimitError = await withRateLimit(request, { limit: 60, window: '1m' });
  if (rateLimitError) return rateLimitError;
  if (!apiKey) {
    await logApiUsage({ api_key_id: '', endpoint: '/api/external/assets', status: 401 });
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }
  const { valid, tenant_id, api_key_id } = await validateApiKey(apiKey);
  if (!valid || !tenant_id) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 401 });
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  const supabase = await createClient();
  const { data: tenant } = await supabase.from('tenants').select('features').eq('id', tenant_id).single();
  if (!tenant?.features) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 403 });
    return NextResponse.json({ error: 'Plan features not found' }, { status: 403 });
  }
  const asset = await request.json();
  asset.tenant_id = tenant_id;
  asset.created_at = new Date().toISOString();
  const { data, error } = await supabase.from('assets').insert(asset).select().single();
  if (error) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 400 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets', status: 200 });
  return NextResponse.json({ data });
} 