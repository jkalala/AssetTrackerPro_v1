/**
 * Webhook GraphQL Resolvers
 */

export const webhookResolvers = {
  deliveryAttempts: async (parent: any, _: any, context: any) => {
    const { data } = await context.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', parent.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    return data || []
  },
}