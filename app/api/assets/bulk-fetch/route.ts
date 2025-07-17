import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { asset_ids, field } = body;
    if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    let query = supabase.from('assets').select('*').in('id', asset_ids);
    if (field) {
      query = supabase.from('assets').select(`id,${field}`).in('id', asset_ids);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data || [], { status: 200 });
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
} 