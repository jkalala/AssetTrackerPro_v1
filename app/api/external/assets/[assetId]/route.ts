import { validateApiKey } from '@/lib/api-key';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { logApiUsage } from '@/lib/api-usage';

export async function GET(request: Request, { params }: { params: { assetId: string } }) {
  const authHeader = request.headers.get('authorization') || '';
  const apiKey = authHeader.replace('Bearer ', '').trim();
  // Rate limit by API key or IP
  const rateLimitError = await withRateLimit(request, { limit: 60, window: '1m' });
  if (rateLimitError) return rateLimitError;
  if (!apiKey) {
    await logApiUsage({ api_key_id: '', endpoint: '/api/external/assets/[assetId]', status: 401 });
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }
  const { valid, tenant_id, api_key_id } = await validateApiKey(apiKey);
  if (!valid || !tenant_id) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets/[assetId]', status: 401 });
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('asset_id', params.assetId)
    .single();
  if (error || !data) {
    await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets/[assetId]', status: 404 });
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
  await logApiUsage({ api_key_id: api_key_id || '', endpoint: '/api/external/assets/[assetId]', status: 200 });
  return NextResponse.json({ data });
} 