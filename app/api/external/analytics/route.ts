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
  // Check if analytics is enabled for the tenant
  const { data: tenant } = await supabase.from('tenants').select('features').eq('id', tenant_id).single();
  if (!tenant?.features?.analytics) {
    return NextResponse.json({ error: 'Analytics not enabled for this tenant' }, { status: 403 });
  }

  // Get analytics: total assets, total users, recent activity
  const { count: assetCount } = await supabase.from('assets').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id);
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id);
  const { data: recentAssets } = await supabase.from('assets').select('asset_id, name, created_at').eq('tenant_id', tenant_id).order('created_at', { ascending: false }).limit(5);

  return NextResponse.json({
    totalAssets: assetCount || 0,
    totalUsers: userCount || 0,
    recentAssets: recentAssets || [],
  });
} 