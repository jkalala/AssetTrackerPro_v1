// =====================================================
// TENANT SERVICE - Multi-Tenant Management
// =====================================================
// Service for managing tenant operations, context, and data isolation

import { createClient } from '@/lib/supabase/server'
import { 
  Tenant, 
  TenantInsert, 
  TenantUpdate, 
  TenantContext,
  TenantUsage,
  Profile 
} from '@/lib/types/database'

export class TenantService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // TENANT MANAGEMENT
  // =====================================================

  /**
   * Create a new tenant
   */
  async createTenant(tenantData: TenantInsert): Promise<{ data: Tenant | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single()

      if (error) {
        console.error('Error creating tenant:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error creating tenant:', error)
      return { data: null, error: 'Failed to create tenant' }
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<{ data: Tenant | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (error) {
        console.error('Error fetching tenant:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error fetching tenant:', error)
      return { data: null, error: 'Failed to fetch tenant' }
    }
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<{ data: Tenant | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Error fetching tenant by slug:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error fetching tenant by slug:', error)
      return { data: null, error: 'Failed to fetch tenant' }
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: TenantUpdate): Promise<{ data: Tenant | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single()

      if (error) {
        console.error('Error updating tenant:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error updating tenant:', error)
      return { data: null, error: 'Failed to update tenant' }
    }
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase
        .from('tenants')
        .update({ 
          status: 'suspended',
          settings: { suspension_reason: reason, suspended_at: new Date().toISOString() }
        })
        .eq('id', tenantId)

      if (error) {
        console.error('Error suspending tenant:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error suspending tenant:', error)
      return { success: false, error: 'Failed to suspend tenant' }
    }
  }

  // =====================================================
  // TENANT CONTEXT MANAGEMENT
  // =====================================================

  /**
   * Get tenant context for current user
   */
  async getTenantContext(userId: string): Promise<{ data: TenantContext | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tenant_id, role, permissions')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return { data: null, error: error.message }
      }

      if (!profile.tenant_id) {
        return { data: null, error: 'User not associated with any tenant' }
      }

      const context: TenantContext = {
        tenantId: profile.tenant_id,
        userId,
        role: profile.role,
        permissions: profile.permissions
      }

      return { data: context, error: null }
    } catch (error) {
      console.error('Unexpected error fetching tenant context:', error)
      return { data: null, error: 'Failed to fetch tenant context' }
    }
  }

  /**
   * Set tenant context in database session
   */
  async setTenantContext(userId: string, tenantId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase.rpc('set_current_user_context', {
        user_id: userId,
        tenant_id: tenantId
      })

      if (error) {
        console.error('Error setting tenant context:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error setting tenant context:', error)
      return { success: false, error: 'Failed to set tenant context' }
    }
  }

  /**
   * Clear tenant context
   */
  async clearTenantContext(): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase.rpc('clear_user_context')

      if (error) {
        console.error('Error clearing tenant context:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error clearing tenant context:', error)
      return { success: false, error: 'Failed to clear tenant context' }
    }
  }

  // =====================================================
  // TENANT USAGE AND LIMITS
  // =====================================================

  /**
   * Get tenant usage statistics
   */
  async getTenantUsage(tenantId: string): Promise<{ data: TenantUsage | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      
      // Get tenant limits
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('asset_limit, user_limit, storage_limit_gb')
        .eq('id', tenantId)
        .single()

      if (tenantError) {
        return { data: null, error: tenantError.message }
      }

      // Get current asset count
      const { count: assetCount, error: assetError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      if (assetError) {
        return { data: null, error: assetError.message }
      }

      // Get current user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      if (userError) {
        return { data: null, error: userError.message }
      }

      // Calculate storage usage (simplified - would need actual file size calculation)
      const storageUsed = 0 // TODO: Implement actual storage calculation

      const usage: TenantUsage = {
        assets: {
          current: assetCount || 0,
          limit: tenant.asset_limit,
          percentage: Math.round(((assetCount || 0) / tenant.asset_limit) * 100)
        },
        users: {
          current: userCount || 0,
          limit: tenant.user_limit,
          percentage: Math.round(((userCount || 0) / tenant.user_limit) * 100)
        },
        storage: {
          current: storageUsed,
          limit: tenant.storage_limit_gb,
          percentage: Math.round((storageUsed / tenant.storage_limit_gb) * 100)
        }
      }

      return { data: usage, error: null }
    } catch (error) {
      console.error('Unexpected error fetching tenant usage:', error)
      return { data: null, error: 'Failed to fetch tenant usage' }
    }
  }

  /**
   * Check if tenant can perform action based on limits
   */
  async canPerformAction(
    tenantId: string, 
    action: 'create_asset' | 'create_user' | 'upload_file',
    size?: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: usage, error: error } = await this.getTenantUsage(tenantId)
      
      if (error || !usage) {
        return { allowed: false, reason: 'Unable to check tenant limits' }
      }

      switch (action) {
        case 'create_asset':
          if (usage.assets.current >= usage.assets.limit) {
            return { 
              allowed: false, 
              reason: `Asset limit reached (${usage.assets.limit}). Please upgrade your plan.` 
            }
          }
          break

        case 'create_user':
          if (usage.users.current >= usage.users.limit) {
            return { 
              allowed: false, 
              reason: `User limit reached (${usage.users.limit}). Please upgrade your plan.` 
            }
          }
          break

        case 'upload_file':
          const fileSizeGB = (size || 0) / (1024 * 1024 * 1024)
          if (usage.storage.current + fileSizeGB > usage.storage.limit) {
            return { 
              allowed: false, 
              reason: `Storage limit would be exceeded. Available: ${usage.storage.limit - usage.storage.current}GB` 
            }
          }
          break
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking tenant limits:', error)
      return { allowed: false, reason: 'Unable to verify tenant limits' }
    }
  }

  // =====================================================
  // TENANT CONFIGURATION
  // =====================================================

  /**
   * Update tenant branding
   */
  async updateTenantBranding(
    tenantId: string, 
    branding: Record<string, any>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase
        .from('tenants')
        .update({ branding })
        .eq('id', tenantId)

      if (error) {
        console.error('Error updating tenant branding:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error updating tenant branding:', error)
      return { success: false, error: 'Failed to update tenant branding' }
    }
  }

  /**
   * Update tenant feature flags
   */
  async updateFeatureFlags(
    tenantId: string, 
    featureFlags: Record<string, boolean>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase
        .from('tenants')
        .update({ feature_flags: featureFlags })
        .eq('id', tenantId)

      if (error) {
        console.error('Error updating feature flags:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected error updating feature flags:', error)
      return { success: false, error: 'Failed to update feature flags' }
    }
  }

  /**
   * Get tenant members
   */
  async getTenantMembers(tenantId: string): Promise<{ data: Profile[] | null; error: string | null }> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tenant members:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Unexpected error fetching tenant members:', error)
      return { data: null, error: 'Failed to fetch tenant members' }
    }
  }

  // =====================================================
  // TENANT VALIDATION
  // =====================================================

  /**
   * Validate tenant access for user
   */
  async validateTenantAccess(userId: string, tenantId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single()

      if (error) {
        return { valid: false, error: 'User not found' }
      }

      if (profile.tenant_id !== tenantId) {
        return { valid: false, error: 'Access denied to tenant' }
      }

      return { valid: true }
    } catch (error) {
      console.error('Error validating tenant access:', error)
      return { valid: false, error: 'Failed to validate access' }
    }
  }

  /**
   * Check if tenant slug is available
   */
  async isSlugAvailable(slug: string, excludeTenantId?: string): Promise<{ available: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      let query = supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)

      if (excludeTenantId) {
        query = query.neq('id', excludeTenantId)
      }

      const { data, error } = await query.single()

      if (error && error.code === 'PGRST116') {
        // No rows returned, slug is available
        return { available: true }
      }

      if (error) {
        return { available: false, error: error.message }
      }

      // Slug exists
      return { available: false }
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return { available: false, error: 'Failed to check slug availability' }
    }
  }
}

// Export singleton instance
export const tenantService = new TenantService()