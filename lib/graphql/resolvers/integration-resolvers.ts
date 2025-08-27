/**
 * Integration GraphQL Resolvers
 */

export const integrationResolvers = {
  syncResults: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('integration_sync_results')
      .select('*')
      .eq('integration_id', parent.id)
      .order('started_at', { ascending: false })
      .limit(10)
    
    return data || []
  },
}