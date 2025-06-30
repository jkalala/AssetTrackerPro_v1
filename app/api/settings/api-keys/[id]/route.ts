import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Get tenant_id from user profile
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });
  // Only allow revoking keys for this tenant
  const { error } = await supabase.from('api_keys').update({ revoked: true }).eq('id', params.id).eq('tenant_id', profile.tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 