import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { importId } = await request.json()
    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Fetch import event
    const { data: importEvent, error: importError } = await supabase
      .from('asset_imports')
      .select('*')
      .eq('id', importId)
      .eq('user_id', user.id)
      .single()
    if (importError || !importEvent) {
      return NextResponse.json({ error: 'Import event not found' }, { status: 404 })
    }
    if (!importEvent.undo_available) {
      return NextResponse.json({ error: 'Undo not available for this import' }, { status: 400 })
    }
    // Delete assets by asset_ids (only those created by this user)
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .in('asset_id', importEvent.asset_ids)
      .eq('created_by', user.id)
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete assets: ' + deleteError.message }, { status: 500 })
    }
    // Mark import as undone
    await supabase
      .from('asset_imports')
      .update({ undo_available: false })
      .eq('id', importId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 