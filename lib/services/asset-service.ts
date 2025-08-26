/**
 * Asset Service
 * Handles asset management operations
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

export class AssetService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getAsset(tenantId: string, assetId: string) {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', assetId)
      .single()

    if (error) throw error
    return data
  }

  async getAssets(tenantId: string, args: any) {
    let query = this.supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)

    if (args.filter) {
      // Apply filters
      if (args.filter.status) {
        query = query.in('status', args.filter.status)
      }
      if (args.filter.search) {
        query = query.or(`name.ilike.%${args.filter.search}%,asset_id.ilike.%${args.filter.search}%`)
      }
    }

    if (args.sort) {
      query = query.order(args.sort.field, { ascending: args.sort.direction === 'ASC' })
    }

    const limit = args.first || 20
    const offset = args.after ? parseInt(args.after) : 0

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw error

    return {
      edges: data.map((asset, index) => ({
        node: asset,
        cursor: (offset + index + 1).toString(),
      })),
      pageInfo: {
        hasNextPage: data.length === limit,
        hasPreviousPage: offset > 0,
        startCursor: data.length > 0 ? (offset + 1).toString() : null,
        endCursor: data.length > 0 ? (offset + data.length).toString() : null,
      },
      totalCount: data.length,
    }
  }

  async createAsset(tenantId: string, input: any) {
    const { data, error } = await this.supabase
      .from('assets')
      .insert({
        tenant_id: tenantId,
        ...input,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAsset(tenantId: string, assetId: string, input: any) {
    const { data, error } = await this.supabase
      .from('assets')
      .update(input)
      .eq('tenant_id', tenantId)
      .eq('id', assetId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAsset(tenantId: string, assetId: string) {
    const { error } = await this.supabase
      .from('assets')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', assetId)

    if (error) throw error
  }

  async bulkCreateAssets(tenantId: string, assets: any[], userId: string) {
    const assetsWithTenant = assets.map(asset => ({
      tenant_id: tenantId,
      created_by: userId,
      ...asset,
    }))

    const { data, error } = await this.supabase
      .from('assets')
      .insert(assetsWithTenant)
      .select()

    if (error) {
      return {
        totalRecords: assets.length,
        successfulRecords: 0,
        failedRecords: assets.length,
        errors: [{ index: 0, message: error.message }],
      }
    }

    return {
      totalRecords: assets.length,
      successfulRecords: data.length,
      failedRecords: 0,
      errors: [],
    }
  }

  async bulkUpdateAssets(tenantId: string, updates: any[]) {
    const results = await Promise.allSettled(
      updates.map(update => 
        this.updateAsset(tenantId, update.id, update.updates)
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const errors = results
      .map((r, index) => r.status === 'rejected' ? { index, message: r.reason.message } : null)
      .filter(Boolean)

    return {
      totalRecords: updates.length,
      successfulRecords: successful,
      failedRecords: failed,
      errors,
    }
  }

  async bulkDeleteAssets(tenantId: string, assetIds: string[]) {
    const { error } = await this.supabase
      .from('assets')
      .delete()
      .eq('tenant_id', tenantId)
      .in('id', assetIds)

    if (error) {
      return {
        totalRecords: assetIds.length,
        successfulRecords: 0,
        failedRecords: assetIds.length,
        errors: [{ index: 0, message: error.message }],
      }
    }

    return {
      totalRecords: assetIds.length,
      successfulRecords: assetIds.length,
      failedRecords: 0,
      errors: [],
    }
  }
}