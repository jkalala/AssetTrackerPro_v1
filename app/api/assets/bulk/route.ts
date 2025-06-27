import { NextResponse } from 'next/server'
import { bulkUpdateAssets, bulkDeleteAssets } from '@/lib/asset-actions'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { operation, asset_ids, value } = body

    if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return NextResponse.json({ error: 'Asset IDs are required' }, { status: 400 })
    }

    if (!operation) {
      return NextResponse.json({ error: 'Operation is required' }, { status: 400 })
    }

    const result = await bulkUpdateAssets({
      asset_ids,
      operation,
      value
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.updatedCount 
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Failed to update assets' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { asset_ids } = body

    if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return NextResponse.json({ error: 'Asset IDs are required' }, { status: 400 })
    }

    const result = await bulkDeleteAssets(asset_ids)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ error: 'Failed to delete assets' }, { status: 500 })
  }
} 