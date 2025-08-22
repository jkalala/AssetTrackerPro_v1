import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { teamId: string } }) {
  const supabase = await createClient();
  const { teamId } = params;
  if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });
  // TODO: Auth check - only team members can view

  // Get team members
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId);
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });
  const userIds = (members || []).map(m => m.user_id);

  // Get assets created by team members
  const { data: assets, error: assetsError } = await supabase
    .from('assets')
    .select('id, status, category, value, created_at')
    .in('created_by', userIds);
  if (assetsError) return NextResponse.json({ error: assetsError.message }, { status: 500 });

  // Asset stats
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'active').length;
  const assetStatusBreakdown = assets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get recent activity (last 10 asset changes)
  const { data: activity, error: activityError } = await supabase
    .from('asset_history')
    .select('id, asset_id, action, performed_by, performed_at')
    .in('performed_by', userIds)
    .order('performed_at', { ascending: false })
    .limit(10);
  if (activityError) return NextResponse.json({ error: activityError.message }, { status: 500 });

  // Team size
  const totalUsers = userIds.length;

  return NextResponse.json({
    totalAssets,
    activeAssets,
    assetStatusBreakdown,
    totalUsers,
    recentActivity: activity || [],
  });
} 