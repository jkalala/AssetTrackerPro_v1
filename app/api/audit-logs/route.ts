import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');
  const entity = url.searchParams.get('entity');
  const action = url.searchParams.get('action');
  const tenant_id = url.searchParams.get('tenant_id');
  const date_from = url.searchParams.get('date_from');
  const date_to = url.searchParams.get('date_to');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('page_size') || '50', 10);

  let query = supabase.from('audit_logs').select('*', { count: 'exact' });
  if (user_id) query = query.eq('user_id', user_id);
  if (entity) query = query.eq('entity', entity);
  if (action) query = query.eq('action', action);
  if (tenant_id) query = query.eq('tenant_id', tenant_id);
  if (date_from) query = query.gte('created_at', date_from);
  if (date_to) query = query.lte('created_at', date_to);
  query = query.order('created_at', { ascending: false });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data, total: count });
} 