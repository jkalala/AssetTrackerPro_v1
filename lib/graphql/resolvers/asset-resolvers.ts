/**
 * Asset GraphQL Resolvers
 */

export const assetResolvers = {
  // Asset field resolvers
  category: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    if (!parent.category_id) return null
    
    const { data } = await (context as any).supabase
      .from('asset_categories')
      .select('*')
      .eq('id', parent.category_id)
      .single()
    
    return data
  },

  assignee: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    if (!parent.assignee_id) return null
    
    const { data } = await (context as any).supabase
      .from('profiles')
      .select('*')
      .eq('id', parent.assignee_id)
      .single()
    
    return data
  },

  parentAsset: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    if (!parent.parent_asset_id) return null
    
    const { data } = await (context as any).supabase
      .from('assets')
      .select('*')
      .eq('id', parent.parent_asset_id)
      .single()
    
    return data
  },

  childAssets: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('assets')
      .select('*')
      .eq('parent_asset_id', parent.id)
    
    return data || []
  },

  createdBy: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('profiles')
      .select('*')
      .eq('id', parent.created_by)
      .single()
    
    return data
  },

  // Placeholder resolvers for complex fields
  iotDevices: () => [],
  sensorData: () => [],
  utilizationMetrics: () => null,
  maintenanceHistory: () => [],
  locationHistory: () => [],
}