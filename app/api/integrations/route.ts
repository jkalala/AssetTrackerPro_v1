import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { type, webhook_url } = await request.json();
  if (!type || !webhook_url || !['slack', 'teams', 'custom'].includes(type)) {
    return NextResponse.json({ error: 'Missing or invalid type/webhook_url' }, { status: 400 });
  }
  // Get current user and tenant
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });
  // Insert integration
  const { error } = await supabase.from('integrations').insert({
    tenant_id: profile.tenant_id,
    type,
    webhook_url,
    status: 'active',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(_request: Request) {
  const supabase = await createClient();
  // Get current user and tenant
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });
  // List integrations
  const { data, error } = await supabase.from('integrations').select('*').eq('tenant_id', profile.tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrations: data });
} 