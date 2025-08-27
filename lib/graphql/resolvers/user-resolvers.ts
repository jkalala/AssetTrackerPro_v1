/**
 * User GraphQL Resolvers
 */

export const userResolvers = {
  // User field resolvers
  assignedAssets: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('assets')
      .select('*')
      .eq('assignee_id', parent.id)
    
    return data || []
  },

  delegations: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('permission_delegations')
      .select('*')
      .eq('delegator_id', parent.id)
    
    return data || []
  },

  department: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    if (!parent.department_id) return null
    
    const { data } = await (context as any).supabase
      .from('departments')
      .select('*')
      .eq('id', parent.department_id)
      .single()
    
    return data
  },

  permissions: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('user_permissions')
      .select(`
        permission:permissions(*)
      `)
      .eq('user_id', parent.id)
    
    return data?.map((up: Record<string, unknown>) => up.permission) || []
  },
}