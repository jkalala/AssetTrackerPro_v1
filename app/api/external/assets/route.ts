import { validateApiKey } from '@/lib/api-key';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
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
  // Check if asset creation is allowed for the tenant's plan
  const { data: tenant } = await supabase.from('tenants').select('features').eq('id', tenant_id).single();
  if (!tenant?.features) {
    return NextResponse.json({ error: 'Plan features not found' }, { status: 403 });
  }
  // Optionally check for asset limits here

  const asset = await request.json();
  asset.tenant_id = tenant_id;
  asset.created_at = new Date().toISOString();

  const { data, error } = await supabase.from('assets').insert(asset).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data });
} 