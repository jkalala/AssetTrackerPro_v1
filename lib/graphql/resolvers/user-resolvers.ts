/**
 * User GraphQL Resolvers
 */

export const userResolvers = {
  // User field resolvers
  assignedAssets: async (parent: any, _: any, context: any) => {
    const { data } = await context.supabase
      .from('assets')
      .select('*')
      .eq('assignee_id', parent.id)
    
    return data || []
  },

  delegations: async (parent: any, _: any, context: any) => {
    const { data } = await context.supabase
      .from('permission_delegations')
      .select('*')
      .eq('delegator_id', parent.id)
    
    return data || []
  },

  department: async (parent: any, _: any, context: any) => {
    if (!parent.department_id) return null
    
    const { data } = await context.supabase
      .from('departments')
      .select('*')
      .eq('id', parent.department_id)
      .single()
    
    return data
  },

  permissions: async (parent: any, _: any, context: any) => {
    const { data } = await context.supabase
      .from('user_permissions')
      .select(`
        permission:permissions(*)
      `)
      .eq('user_id', parent.id)
    
    return data?.map((up: any) => up.permission) || []
  },
}