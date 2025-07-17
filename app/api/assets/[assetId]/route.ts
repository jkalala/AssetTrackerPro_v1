import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAsset, updateAsset, deleteAsset } from '@/lib/asset-actions'
import { isAuthorized } from '@/lib/rbac/utils'
import { Permission } from '@/lib/rbac/types'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    const result = await getAsset(params.assetId)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ asset: result.data })
  } catch (error) {
    console.error('Asset GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // RBAC permission check
    const authorized = await isAuthorized(user.id, 'update:asset' as Permission)
    if (!authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const body = await request.json()
    const result = await updateAsset(params.assetId, body)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ asset: result.data })
  } catch (error) {
    console.error('Asset PUT error:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // RBAC permission check
    const authorized = await isAuthorized(user.id, 'delete:asset' as Permission)
    if (!authorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    const result = await deleteAsset(params.assetId)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Asset DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
} 