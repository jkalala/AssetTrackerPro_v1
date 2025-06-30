import { validateApiKey } from '@/lib/api-key';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { assetId: string } }) {
  const authHeader = request.headers.get('authorization') || '';
  const apiKey = authHeader.replace('Bearer ', '').trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const { valid, tenant_id } = await validateApiKey(apiKey);
  if (!valid || !tenant_id) {
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
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
} 