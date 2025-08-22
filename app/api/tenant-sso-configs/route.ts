import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Get current user and tenant
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });
  // List SSO configs for tenant
  const { data, error } = await supabase.from('tenant_sso_configs').select('*').eq('tenant_id', profile.tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configs: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { provider, metadata, client_id, client_secret, enabled } = await request.json();
  // Get current user and tenant
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });
  // Upsert SSO config for tenant/provider
  const { error } = await supabase.from('tenant_sso_configs').upsert({
    tenant_id: profile.tenant_id,
    provider,
    metadata,
    client_id,
    client_secret,
    enabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'tenant_id,provider' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 