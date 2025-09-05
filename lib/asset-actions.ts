'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from './audit-log'
import { deliverWebhooks } from './webhook-utils'
import { sendIntegrationNotification } from './integration-utils'

export interface Asset {
  id?: string
  asset_id: string
  name: string
  description?: string | null
  category: string
  status: 'active' | 'maintenance' | 'retired' | 'lost' | 'damaged'
  location?: string | null
  purchase_value?: number | null
  purchase_date?: string | null
  manufacturer?: string | null
  model?: string | null
  serial_number?: string | null
  warranty_expiry?: string | null
  assigned_to?: string | null
  qr_code?: string | null
  tags?: string[] | null
  notes?: string | null
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface AssetFilters {
  status?: string
  category?: string
  location?: string
  assigned_to?: string
  search?: string
  date_from?: string
  date_to?: string
  value_min?: number
  value_max?: number
}

export interface BulkOperation {
  asset_ids: string[]
  operation: 'update_status' | 'update_location' | 'update_category' | 'assign_user' | 'delete'
  value: string | number
}

export async function addAsset(assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    // Check if asset_id already exists
    const { data: existingAsset } = await supabase
      .from('assets')
      .select('id')
      .eq('asset_id', assetData.asset_id)
      .single()

    if (existingAsset) {
      return { error: 'Asset ID already exists' }
    }

    const { data, error } = await supabase
      .from('assets')
      .insert([
        {
          ...assetData,
          created_by: user.id,
          tags: assetData.tags || [],
          notes: assetData.notes || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error adding asset:', error)
      return { error: error.message }
    }

    revalidatePath('/assets')
    revalidatePath('/dashboard')

    // Audit log: asset created
    await logAuditEvent({
      user_id: user.id,
      action: 'create',
      entity: 'asset',
      entity_id: data.id,
      details: { asset_id: data.asset_id, name: data.name },
      tenant_id: data.tenant_id || undefined,
      // ip_address, user_agent can be added from API context
    })
    // Trigger webhooks
    if (data.tenant_id) {
      await deliverWebhooks({ tenant_id: data.tenant_id, event: 'asset.created', payload: data })
      await sendIntegrationNotification({
        tenant_id: data.tenant_id,
        message: `Asset created: ${data.name}`,
      })
    }

    return { data }
  } catch (error) {
    console.error('Error in addAsset:', error)
    return { error: 'Failed to add asset' }
  }
}

export async function updateAsset(assetId: string, updates: Partial<Asset>) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    // Check if user owns the asset or is admin
    const { data: existingAsset } = await supabase
      .from('assets')
      .select('created_by, tenant_id')
      .eq('id', assetId)
      .single()

    if (!existingAsset) {
      return { error: 'Asset not found' }
    }

    if (existingAsset.created_by !== user.id) {
      return { error: 'Unauthorized to update this asset' }
    }

    const { data, error } = await supabase
      .from('assets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)
      .select()
      .single()

    if (error) {
      console.error('Error updating asset:', error)
      return { error: error.message }
    }

    revalidatePath('/assets')
    revalidatePath(`/asset/${assetId}`)
    revalidatePath('/dashboard')

    // Audit log: asset updated
    await logAuditEvent({
      user_id: user.id,
      action: 'update',
      entity: 'asset',
      entity_id: assetId,
      details: { updates },
      tenant_id: data?.tenant_id || undefined,
      before: existingAsset,
      after: data,
      // ip_address, user_agent can be added from API context
    })
    // Trigger webhooks
    if (data?.tenant_id) {
      await deliverWebhooks({ tenant_id: data.tenant_id, event: 'asset.updated', payload: data })
      await sendIntegrationNotification({
        tenant_id: data.tenant_id,
        message: `Asset updated: ${data.name}`,
      })
    }

    return { data }
  } catch (error) {
    console.error('Error in updateAsset:', error)
    return { error: 'Failed to update asset' }
  }
}

export async function deleteAsset(assetId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    // Check if user owns the asset
    const { data: existingAsset } = await supabase
      .from('assets')
      .select('created_by, tenant_id')
      .eq('id', assetId)
      .single()

    if (!existingAsset) {
      return { error: 'Asset not found' }
    }

    if (existingAsset.created_by !== user.id) {
      return { error: 'Unauthorized to delete this asset' }
    }

    const { error } = await supabase.from('assets').delete().eq('id', assetId)

    if (error) {
      console.error('Error deleting asset:', error)
      return { error: error.message }
    }

    revalidatePath('/assets')
    revalidatePath('/dashboard')

    // Audit log: asset deleted
    await logAuditEvent({
      user_id: user.id,
      action: 'delete',
      entity: 'asset',
      entity_id: assetId,
      details: {},
      tenant_id: existingAsset.tenant_id || undefined,
      before: existingAsset,
      // ip_address, user_agent can be added from API context
    })
    // Trigger webhooks
    if (existingAsset.tenant_id) {
      await deliverWebhooks({
        tenant_id: existingAsset.tenant_id,
        event: 'asset.deleted',
        payload: { assetId },
      })
      await sendIntegrationNotification({
        tenant_id: existingAsset.tenant_id,
        message: `Asset deleted: ${assetId}`,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteAsset:', error)
    return { error: 'Failed to delete asset' }
  }
}

export async function getAsset(assetId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('created_by', user.id)
      .single()

    if (error) {
      console.error('Error fetching asset:', error)
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error('Error in getAsset:', error)
    return { error: 'Failed to fetch asset' }
  }
}

export async function getAssets(filters?: AssetFilters) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    let query = supabase
      .from('assets')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.location) {
      query = query.eq('location', filters.location)
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters?.value_min) {
      query = query.gte('purchase_value', filters.value_min)
    }

    if (filters?.value_max) {
      query = query.lte('purchase_value', filters.value_max)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assets:', error)
      return { error: error.message }
    }

    // Apply search filter if provided
    let filteredData = data || []
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredData = filteredData.filter(
        asset =>
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.description?.toLowerCase().includes(searchTerm) ||
          asset.category.toLowerCase().includes(searchTerm) ||
          asset.location?.toLowerCase().includes(searchTerm) ||
          asset.asset_id.toLowerCase().includes(searchTerm)
      )
    }

    return { data: filteredData }
  } catch (error) {
    console.error('Error in getAssets:', error)
    return { error: 'Failed to fetch assets' }
  }
}

export async function bulkUpdateAssets(operation: BulkOperation) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    // Verify user owns all assets
    const { data: userAssets } = await supabase
      .from('assets')
      .select('id')
      .eq('created_by', user.id)
      .in('id', operation.asset_ids)

    if (!userAssets || userAssets.length !== operation.asset_ids.length) {
      return { error: 'Unauthorized to update some assets' }
    }

    let updateData: any = {}

    switch (operation.operation) {
      case 'update_status':
        updateData.status = operation.value
        break
      case 'update_location':
        updateData.location = operation.value
        break
      case 'update_category':
        updateData.category = operation.value
        break
      case 'assign_user':
        updateData.assigned_to = operation.value
        break
      default:
        return { error: 'Invalid operation' }
    }

    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase.from('assets').update(updateData).in('id', operation.asset_ids)

    if (error) {
      console.error('Error in bulk update:', error)
      return { error: error.message }
    }

    revalidatePath('/assets')
    revalidatePath('/dashboard')

    return { success: true, updatedCount: operation.asset_ids.length }
  } catch (error) {
    console.error('Error in bulkUpdateAssets:', error)
    return { error: 'Failed to update assets' }
  }
}

export async function bulkDeleteAssets(assetIds: string[]) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    // Verify user owns all assets
    const { data: userAssets } = await supabase
      .from('assets')
      .select('id')
      .eq('created_by', user.id)
      .in('id', assetIds)

    if (!userAssets || userAssets.length !== assetIds.length) {
      return { error: 'Unauthorized to delete some assets' }
    }

    const { error } = await supabase.from('assets').delete().in('id', assetIds)

    if (error) {
      console.error('Error in bulk delete:', error)
      return { error: error.message }
    }

    revalidatePath('/assets')
    revalidatePath('/dashboard')

    return { success: true, deletedCount: assetIds.length }
  } catch (error) {
    console.error('Error in bulkDeleteAssets:', error)
    return { error: 'Failed to delete assets' }
  }
}

export async function getAssetStats() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Unauthorized' }
    }

    const { data: assets } = await supabase
      .from('assets')
      .select('status, category, purchase_value, created_at')
      .eq('created_by', user.id)

    if (!assets) {
      return { data: { total: 0, byStatus: {}, byCategory: {}, totalValue: 0 } }
    }

    const stats = {
      total: assets.length,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      totalValue: 0,
      recentAdditions: 0,
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    assets.forEach(
      (asset: {
        status: string
        category: string
        purchase_value?: number
        created_at?: string
      }) => {
        // Status counts
        stats.byStatus[asset.status] = (stats.byStatus[asset.status] || 0) + 1

        // Category counts
        stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1

        // Total value
        if (asset.purchase_value) {
          stats.totalValue += asset.purchase_value
        }

        // Recent additions
        if (asset.created_at && new Date(asset.created_at) > thirtyDaysAgo) {
          stats.recentAdditions++
        }
      }
    )

    return { data: stats }
  } catch (error) {
    console.error('Error in getAssetStats:', error)
    return { error: 'Failed to fetch asset statistics' }
  }
}

export async function generateAssetId(category?: string) {
  const prefix = category ? category.toUpperCase().slice(0, 3) : 'AST'
  const timestamp = Date.now().toString().slice(-6)
  const randomNum = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0')
  return `${prefix}-${timestamp}-${randomNum}`
}

export async function checkAssetIdExists(assetId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('assets')
      .select('id')
      .eq('asset_id', assetId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking asset ID:', error)
      return { error: error.message }
    }

    return { exists: !!data }
  } catch (error) {
    console.error('Error in checkAssetIdExists:', error)
    return { error: 'Failed to check asset ID' }
  }
}
