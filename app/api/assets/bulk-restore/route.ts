import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { assets } = body;
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json({ success: false, error: 'No assets to restore' }, { status: 400 });
    }
    // Remove id to avoid conflicts if using serial PK
    const assetsToInsert = assets.map(({ id, ...rest }) => rest);
    const { error } = await supabase.from('assets').insert(assetsToInsert);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, restored: assets.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
} 