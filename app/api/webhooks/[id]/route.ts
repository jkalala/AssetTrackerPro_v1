import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = params
  const { url, events, secret, status } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  // TODO: Auth check - only tenant owner/admin can update
  const { error } = await supabase
    .from('webhooks')
    .update({ url, events, secret, status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  // TODO: Auth check - only tenant owner/admin can delete
  const { error } = await supabase.from('webhooks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
