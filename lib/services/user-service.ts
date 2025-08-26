/**
 * User Service
 * Handles user management operations
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

export class UserService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getUser(tenantId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  async getUsers(tenantId: string, args: any) {
    let query = this.supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)

    if (args.filter) {
      if (args.filter.role) {
        query = query.in('role', args.filter.role)
      }
      if (args.filter.isActive !== undefined) {
        query = query.eq('is_active', args.filter.isActive)
      }
      if (args.filter.search) {
        query = query.or(`first_name.ilike.%${args.filter.search}%,last_name.ilike.%${args.filter.search}%,email.ilike.%${args.filter.search}%`)
      }
    }

    const limit = args.first || 20
    const offset = args.after ? parseInt(args.after) : 0

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) throw error

    return {
      edges: data.map((user, index) => ({
        node: user,
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
}