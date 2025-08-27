// =====================================================
// DELEGATION SERVICE
// =====================================================
// Service for managing permission delegations and guest access

import { createClient } from '@/lib/supabase/server'
import { 
  PermissionDelegation, 
  PermissionDelegationUpdate,
  GuestAccess,
  GuestAccessUpdate,
  CreateDelegationRequest,
  CreateGuestAccessRequest
} from '@/lib/types/rbac'

export class DelegationService {
  private async getSupabase() {
    return await createClient()
  }

  // =====================================================
  // PERMISSION DELEGATION MANAGEMENT
  // =====================================================

  async createDelegation(
    tenantId: string, 
    delegatorId: string, 
    request: CreateDelegationRequest
  ): Promise<PermissionDelegation> {
    try {
      const supabase = await this.getSupabase()
      
      // Validate delegatee exists
      const { data: delegatee } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', request.delegatee_id)
        .eq('tenant_id', tenantId)
        .single()

      if (!delegatee) {
        throw new Error('Delegatee not found in tenant')
      }

      // Validate delegator has the permissions they want to delegate
      if (request.permission_names && request.permission_names.length > 0) {
        const hasPermissions = await this.validateDelegatorPermissions(
          tenantId,
          delegatorId,
          request.permission_names
        )

        if (!hasPermissions) {
          throw new Error('Delegator does not have all the permissions they are trying to delegate')
        }
      }

      // Validate role delegation if specified
      if (request.role_id) {
        const hasRole = await this.validateDelegatorRole(tenantId, delegatorId, request.role_id)
        if (!hasRole) {
          throw new Error('Delegator does not have the role they are trying to delegate')
        }
      }

      // Get permission IDs from names
      let permissionIds: string[] = []
      if (request.permission_names && request.permission_names.length > 0) {
        const { data: permissions } = await supabase
          .from('permissions')
          .select('id')
          .in('name', request.permission_names)

        permissionIds = permissions?.map(p => p.id) || []

        if (permissionIds.length !== request.permission_names.length) {
          throw new Error('Some permissions were not found')
        }
      }

      // Validate expiration date
      const expiresAt = new Date(request.expires_at)
      const now = new Date()
      const maxDuration = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year max

      if (expiresAt <= now) {
        throw new Error('Expiration date must be in the future')
      }

      if (expiresAt > maxDuration) {
        throw new Error('Delegation cannot exceed 1 year')
      }

      const { data: delegation, error } = await supabase
        .from('permission_delegations')
        .insert({
          tenant_id: tenantId,
          delegator_id: delegatorId,
          delegatee_id: request.delegatee_id,
          role_id: request.role_id,
          permission_ids: permissionIds,
          scope: request.scope || 'personal',
          resource_filters: request.resource_filters || {},
          conditions: request.conditions || {},
          expires_at: request.expires_at,
          reason: request.reason,
          notes: request.notes
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create delegation: ${error.message}`)
      }

      return delegation
    } catch (error) {
      console.error('Error creating delegation:', error)
      throw error
    }
  }

  async updateDelegation(
    tenantId: string, 
    delegationId: string, 
    updates: PermissionDelegationUpdate,
    updatedBy: string
  ): Promise<PermissionDelegation> {
    try {
      const supabase = await this.getSupabase()
      
      // Check if delegation exists and user can modify it
      const { data: delegation } = await supabase
        .from('permission_delegations')
        .select('id, delegator_id, status')
        .eq('id', delegationId)
        .eq('tenant_id', tenantId)
        .single()

      if (!delegation) {
        throw new Error('Delegation not found')
      }

      if (delegation.delegator_id !== updatedBy) {
        throw new Error('Only the delegator can modify this delegation')
      }

      if (delegation.status === 'expired' || delegation.status === 'revoked') {
        throw new Error('Cannot modify expired or revoked delegations')
      }

      // Validate expiration date if being updated
      if (updates.expires_at) {
        const expiresAt = new Date(updates.expires_at)
        const now = new Date()

        if (expiresAt <= now) {
          throw new Error('Expiration date must be in the future')
        }
      }

      const { data: updatedDelegation, error } = await supabase
        .from('permission_delegations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', delegationId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update delegation: ${error.message}`)
      }

      return updatedDelegation
    } catch (error) {
      console.error('Error updating delegation:', error)
      throw error
    }
  }

  async revokeDelegation(
    tenantId: string, 
    delegationId: string, 
    revokedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: delegation } = await supabase
        .from('permission_delegations')
        .select('id, delegator_id, status')
        .eq('id', delegationId)
        .eq('tenant_id', tenantId)
        .single()

      if (!delegation) {
        throw new Error('Delegation not found')
      }

      if (delegation.delegator_id !== revokedBy) {
        throw new Error('Only the delegator can revoke this delegation')
      }

      if (delegation.status === 'revoked') {
        throw new Error('Delegation is already revoked')
      }

      const { error } = await supabase
        .from('permission_delegations')
        .update({
          status: 'revoked',
          notes: reason ? `Revoked: ${reason}` : 'Revoked by delegator',
          updated_at: new Date().toISOString()
        })
        .eq('id', delegationId)
        .eq('tenant_id', tenantId)

      if (error) {
        throw new Error(`Failed to revoke delegation: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error revoking delegation:', error)
      throw error
    }
  }

  async getDelegation(tenantId: string, delegationId: string): Promise<PermissionDelegation | null> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: delegation } = await supabase
        .from('permission_delegations')
        .select(`
          *,
          delegator:profiles!permission_delegations_delegator_id_fkey (
            id,
            full_name,
            email
          ),
          delegatee:profiles!permission_delegations_delegatee_id_fkey (
            id,
            full_name,
            email
          ),
          role:roles (
            id,
            name,
            display_name
          )
        `)
        .eq('id', delegationId)
        .eq('tenant_id', tenantId)
        .single()

      return delegation
    } catch (error) {
      console.error('Error getting delegation:', error)
      return null
    }
  }

  async getUserDelegations(
    tenantId: string, 
    userId: string, 
    type: 'delegated' | 'received' | 'all' = 'all'
  ): Promise<PermissionDelegation[]> {
    try {
      const supabase = await this.getSupabase()
      
      let query = supabase
        .from('permission_delegations')
        .select(`
          *,
          delegator:profiles!permission_delegations_delegator_id_fkey (
            id,
            full_name,
            email
          ),
          delegatee:profiles!permission_delegations_delegatee_id_fkey (
            id,
            full_name,
            email
          ),
          role:roles (
            id,
            name,
            display_name
          )
        `)
        .eq('tenant_id', tenantId)

      switch (type) {
        case 'delegated':
          query = query.eq('delegator_id', userId)
          break
        case 'received':
          query = query.eq('delegatee_id', userId)
          break
        case 'all':
          query = query.or(`delegator_id.eq.${userId},delegatee_id.eq.${userId}`)
          break
      }

      const { data: delegations, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to get user delegations: ${error.message}`)
      }

      return delegations || []
    } catch (error) {
      console.error('Error getting user delegations:', error)
      throw error
    }
  }

  async getActiveDelegations(tenantId: string): Promise<PermissionDelegation[]> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: delegations, error } = await supabase
        .from('permission_delegations')
        .select(`
          *,
          delegator:profiles!permission_delegations_delegator_id_fkey (
            id,
            full_name,
            email
          ),
          delegatee:profiles!permission_delegations_delegatee_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to get active delegations: ${error.message}`)
      }

      return delegations || []
    } catch (error) {
      console.error('Error getting active delegations:', error)
      throw error
    }
  }

  // =====================================================
  // GUEST ACCESS MANAGEMENT
  // =====================================================

  async createGuestAccess(
    tenantId: string, 
    invitedBy: string, 
    request: CreateGuestAccessRequest
  ): Promise<GuestAccess> {
    try {
      const supabase = await this.getSupabase()
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(request.email)) {
        throw new Error('Invalid email format')
      }

      // Check if guest access already exists for this email
      const { data: existingGuest } = await supabase
        .from('guest_access')
        .select('id, is_active')
        .eq('tenant_id', tenantId)
        .eq('email', request.email)
        .single()

      if (existingGuest && existingGuest.is_active) {
        throw new Error('Active guest access already exists for this email')
      }

      // Validate role if specified
      if (request.role_id) {
        const { data: role } = await supabase
          .from('roles')
          .select('id, is_active')
          .eq('id', request.role_id)
          .eq('tenant_id', tenantId)
          .single()

        if (!role) {
          throw new Error('Role not found')
        }

        if (!role.is_active) {
          throw new Error('Cannot assign inactive role to guest')
        }
      }

      // Validate expiration date
      const expiresAt = new Date(request.expires_at)
      const now = new Date()
      const maxDuration = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days max

      if (expiresAt <= now) {
        throw new Error('Expiration date must be in the future')
      }

      if (expiresAt > maxDuration) {
        throw new Error('Guest access cannot exceed 90 days')
      }

      const { data: guestAccess, error } = await supabase
        .from('guest_access')
        .insert({
          tenant_id: tenantId,
          email: request.email,
          full_name: request.full_name,
          invited_by: invitedBy,
          role_id: request.role_id,
          permissions: request.permissions || {},
          resource_access: request.resource_access || {},
          expires_at: request.expires_at,
          max_sessions: request.max_sessions || 1
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create guest access: ${error.message}`)
      }

      return guestAccess
    } catch (error) {
      console.error('Error creating guest access:', error)
      throw error
    }
  }

  async updateGuestAccess(
    tenantId: string, 
    guestId: string, 
    updates: GuestAccessUpdate
  ): Promise<GuestAccess> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: guestAccess, error } = await supabase
        .from('guest_access')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update guest access: ${error.message}`)
      }

      return guestAccess
    } catch (error) {
      console.error('Error updating guest access:', error)
      throw error
    }
  }

  async revokeGuestAccess(tenantId: string, guestId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('guest_access')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)
        .eq('tenant_id', tenantId)

      if (error) {
        throw new Error(`Failed to revoke guest access: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error revoking guest access:', error)
      throw error
    }
  }

  async getGuestAccess(tenantId: string, guestId: string): Promise<GuestAccess | null> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: guestAccess } = await supabase
        .from('guest_access')
        .select(`
          *,
          inviter:profiles!guest_access_invited_by_fkey (
            id,
            full_name,
            email
          ),
          role:roles (
            id,
            name,
            display_name
          )
        `)
        .eq('id', guestId)
        .eq('tenant_id', tenantId)
        .single()

      return guestAccess
    } catch (error) {
      console.error('Error getting guest access:', error)
      return null
    }
  }

  async getActiveGuestAccess(tenantId: string): Promise<GuestAccess[]> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: guestAccess, error } = await supabase
        .from('guest_access')
        .select(`
          *,
          inviter:profiles!guest_access_invited_by_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to get active guest access: ${error.message}`)
      }

      return guestAccess || []
    } catch (error) {
      console.error('Error getting active guest access:', error)
      throw error
    }
  }

  // =====================================================
  // CLEANUP AND MAINTENANCE
  // =====================================================

  async cleanupExpiredDelegations(tenantId?: string): Promise<number> {
    try {
      const supabase = await this.getSupabase()
      
      let query = supabase
        .from('permission_delegations')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString())

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { error, count } = await query

      if (error) {
        throw new Error(`Failed to cleanup expired delegations: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      console.error('Error cleaning up expired delegations:', error)
      throw error
    }
  }

  async cleanupExpiredGuestAccess(tenantId?: string): Promise<number> {
    try {
      const supabase = await this.getSupabase()
      
      let query = supabase
        .from('guest_access')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { error, count } = await query

      if (error) {
        throw new Error(`Failed to cleanup expired guest access: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      console.error('Error cleaning up expired guest access:', error)
      throw error
    }
  }

  // =====================================================
  // VALIDATION HELPERS
  // =====================================================

  private async validateDelegatorPermissions(
    _tenantId: string, 
    _delegatorId: string, 
    _permissionNames: string[]
  ): Promise<boolean> {
    try {
      // This would integrate with the permission service to check if the delegator has all the permissions
      // For now, we'll assume they do (this should be implemented with actual permission checking)
      return true
    } catch (error) {
      console.error('Error validating delegator permissions:', error)
      return false
    }
  }

  private async validateDelegatorRole(
    tenantId: string, 
    delegatorId: string, 
    roleId: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', delegatorId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .single()

      return !!userRole
    } catch (error) {
      console.error('Error validating delegator role:', error)
      return false
    }
  }

  // =====================================================
  // ANALYTICS AND REPORTING
  // =====================================================

  async getDelegationStats(tenantId: string, days = 30): Promise<{
    total_delegations: number
    active_delegations: number
    expired_delegations: number
    revoked_delegations: number
    guest_access_count: number
    most_delegated_permissions: { permission_name: string; count: number }[]
  }> {
    try {
      const supabase = await this.getSupabase()
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      // Get delegation counts
      const { data: delegations } = await supabase
        .from('permission_delegations')
        .select('status, permission_ids')
        .eq('tenant_id', tenantId)
        .gte('created_at', since)

      const totalDelegations = delegations?.length || 0
      const activeDelegations = delegations?.filter((d: Record<string, unknown>) => d.status === 'active').length || 0
      const expiredDelegations = delegations?.filter((d: Record<string, unknown>) => d.status === 'expired').length || 0
      const revokedDelegations = delegations?.filter((d: Record<string, unknown>) => d.status === 'revoked').length || 0

      // Get guest access count
      const { data: guestAccess } = await supabase
        .from('guest_access')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      const guestAccessCount = guestAccess?.length || 0

      // Get most delegated permissions (placeholder)
      const mostDelegatedPermissions = [
        { permission_name: 'read:asset', count: 15 },
        { permission_name: 'update:asset', count: 8 },
        { permission_name: 'create:report', count: 5 }
      ]

      return {
        total_delegations: totalDelegations,
        active_delegations: activeDelegations,
        expired_delegations: expiredDelegations,
        revoked_delegations: revokedDelegations,
        guest_access_count: guestAccessCount,
        most_delegated_permissions: mostDelegatedPermissions
      }
    } catch (error) {
      console.error('Error getting delegation stats:', error)
      throw error
    }
  }
}