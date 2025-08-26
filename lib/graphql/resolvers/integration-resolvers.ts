/**
 * Integration GraphQL Resolvers
 */

export const integrationResolvers = {
  syncResults: async (parent: any, _: any, context: any) => {
    const { data } = await context.supabase
      .from('integration_sync_results')
      .select('*')
      .eq('integration_id', parent.id)
      .order('started_at', { ascending: false })
      .limit(10)
    
    return data || []
  },
}