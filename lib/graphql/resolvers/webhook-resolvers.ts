/**
 * Webhook GraphQL Resolvers
 */

export const webhookResolvers = {
  deliveryAttempts: async (parent: Record<string, unknown>, _: Record<string, unknown>, context: Record<string, unknown>) => {
    const { data } = await (context as any).supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', parent.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    return data || []
  },
}