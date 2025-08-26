/**
 * Analytics Service
 * Handles analytics and reporting operations
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

export class AnalyticsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getAssetAnalytics(tenantId: string, args: { filter?: any; period: string }) {
    // Get total assets
    const { count: totalAssets } = await this.supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    // Get assets by status
    const { data: statusData } = await this.supabase
      .from('assets')
      .select('status')
      .eq('tenant_id', tenantId)

    const assetsByStatus = statusData?.reduce((acc: any[], asset) => {
      const existing = acc.find(item => item.status === asset.status)
      if (existing) {
        existing.count++
      } else {
        acc.push({ status: asset.status, count: 1 })
      }
      return acc
    }, []) || []

    // Get assets by category
    const { data: categoryData } = await this.supabase
      .from('assets')
      .select(`
        category_id,
        asset_categories(name)
      `)
      .eq('tenant_id', tenantId)

    const assetsByCategory = categoryData?.reduce((acc: any[], asset: any) => {
      const categoryName = asset.asset_categories?.name || 'Uncategorized'
      const existing = acc.find(item => item.category.name === categoryName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ 
          category: { name: categoryName }, 
          count: 1 
        })
      }
      return acc
    }, []) || []

    // Calculate utilization rate (simplified)
    const utilizationRate = 0.75 // Placeholder

    // Get maintenance overdue count
    const { count: maintenanceOverdue } = await this.supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('next_maintenance_date', new Date().toISOString())

    // Calculate total value
    const { data: valueData } = await this.supabase
      .from('assets')
      .select('current_value')
      .eq('tenant_id', tenantId)

    const totalValue = valueData?.reduce((sum, asset) => 
      sum + (asset.current_value || 0), 0) || 0

    return {
      totalAssets: totalAssets || 0,
      assetsByStatus,
      assetsByCategory,
      utilizationRate,
      maintenanceOverdue: maintenanceOverdue || 0,
      totalValue,
      depreciationTrend: [], // Placeholder
    }
  }
}