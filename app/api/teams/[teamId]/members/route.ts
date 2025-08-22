import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorized } from '@/lib/rbac/utils';

export async function GET(request: Request, { params }: { params: { teamId: string } }) {
  const supabase = await createClient();
  const { teamId } = params;
  if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Check if user is a team member
  const { data: member } = await supabase.from('team_members').select('role').eq('team_id', teamId).eq('user_id', user.id).single();
  if (!member || !(await isAuthorized(user.id, 'read:users'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, role, joined_at, profiles: user_id (email, full_name, avatar_url)')
    .eq('team_id', teamId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
} 