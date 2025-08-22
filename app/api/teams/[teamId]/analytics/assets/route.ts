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

  // Count by category
  const byCategory = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Value stats
  const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);
  const avgValue = assets.length ? totalValue / assets.length : 0;

  // Assets added per month (last 12 months)
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d.toISOString().slice(0, 7); // YYYY-MM
  }).reverse();
  const byMonth = months.reduce((acc, month) => {
    acc[month] = 0;
    return acc;
  }, {} as Record<string, number>);
  assets.forEach(a => {
    const month = a.created_at?.slice(0, 7);
    if (month && byMonth[month] !== undefined) byMonth[month]++;
  });

  return NextResponse.json({
    byCategory,
    totalValue,
    avgValue,
    byMonth,
  });
} 