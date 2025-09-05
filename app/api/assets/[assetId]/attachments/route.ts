import { createClient as createClientServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

export const runtime = 'nodejs'

// GET: List attachments for asset
export async function GET(req: Request, { params }: { params: { assetId: string } }) {
  const supabase = await createClientServer()
  const { assetId } = params
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // List attachments
  const { data, error } = await supabase
    .from('asset_attachments')
    .select('*')
    .eq('asset_id', assetId)
    .order('uploaded_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attachments: data })
}

// POST: Upload attachment
export async function POST(req: Request, { params }: { params: { assetId: string } }) {
  const supabase = await createClientServer()
  const { assetId } = params
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'update:asset' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const description = formData.get('description') as string | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const filePath = `${assetId}/${fileName}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('asset-attachments')
    .upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('asset-attachments').getPublicUrl(filePath)
  const fileUrl = publicUrlData.publicUrl
  // Save metadata
  const { data: insertData, error: insertError } = await supabase
    .from('asset_attachments')
    .insert({
      asset_id: assetId,
      file_url: fileUrl,
      file_name: file.name,
      type: file.type,
      size: file.size,
      uploaded_by: user.id,
      description: description || null,
    })
    .select()
    .single()
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ attachment: insertData })
}

// DELETE: Remove attachment
export async function DELETE(req: Request, { params }: { params: { assetId: string } }) {
  const supabase = await createClientServer()
  // Auth check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // RBAC permission check
  const authorized = await isAuthorized(user.id, 'update:asset' as Permission)
  if (!authorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'Missing attachment id' }, { status: 400 })
  // Get attachment
  const { data: attachment, error: fetchError } = await supabase
    .from('asset_attachments')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !attachment)
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  // Remove from storage
  const filePath = attachment.file_url.split('/asset-attachments/')[1]
  if (filePath) {
    await supabase.storage.from('asset-attachments').remove([filePath])
  }
  // Remove from DB
  const { error: deleteError } = await supabase.from('asset_attachments').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
