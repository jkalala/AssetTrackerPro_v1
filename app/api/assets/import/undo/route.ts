import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Find the most recent import for this user
    const { data: importLog, error: importError } = await supabase
      .from('asset_imports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (importError || !importLog) {
      return NextResponse.json({ error: 'No import found to undo' }, { status: 404 })
    }
    const assetIds = importLog.asset_ids || []
    if (!assetIds.length) {
      return NextResponse.json({ error: 'No assets to delete in last import' }, { status: 400 })
    }
    // Delete assets
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .in('asset_id', assetIds)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    // Optionally, mark the import as undone
    await supabase
      .from('asset_imports')
      .update({ undone: true })
      .eq('id', importLog.id)
    return NextResponse.json({ success: true, deletedCount: assetIds.length, importId: importLog.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 