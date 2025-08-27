/**
 * Search Service
 * Handles global search operations
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

export class SearchService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async search(tenantId: string, args: { query: string; types?: string[]; limit?: number }) {
    const { query, types = ['assets', 'users', 'locations'], limit = 10 } = args

    const results: Record<string, unknown> = {
      assets: [],
      users: [],
      locations: [],
      totalResults: 0,
    }

    // Search assets
    if (types.includes('assets')) {
      const { data: assets } = await this.supabase
        .from('assets')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`name.ilike.%${query}%,asset_id.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit)

      results.assets = assets || []
    }

    // Search users
    if (types.includes('users')) {
      const { data: users } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit)

      results.users = users || []
    }

    // Search locations (placeholder)
    if (types.includes('locations')) {
      results.locations = []
    }

    results.totalResults = (results.assets as any[])?.length || 0 + (results.users as any[])?.length || 0 + (results.locations as any[])?.length || 0

    return results
  }
}