import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch user profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  // Fetch assets created by user
  const { data: assets } = await supabase.from('assets').select('*').eq('created_by', user.id);
  // Fetch asset history
  const { data: assetHistory } = await supabase.from('asset_history').select('*').eq('performed_by', user.id);
  // Fetch audit logs
  const { data: auditLogs } = await supabase.from('audit_logs').select('*').eq('user_id', user.id);

  const exportData = {
    profile,
    assets,
    assetHistory,
    auditLogs,
  };

  const json = JSON.stringify(exportData, null, 2);
  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="user-data.json"',
    },
  });
} 