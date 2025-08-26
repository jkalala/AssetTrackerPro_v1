"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Tenant, type TenantContext, TenantUsage } from '@/lib/types/database'

interface TenantProviderState {
  tenant: Tenant | null
  tenantContext: TenantContext | null
  usage: TenantUsage | null
  loading: boolean
  error: string | null
  refreshTenant: () => Promise<void>
  refreshUsage: () => Promise<void>
  updateTenantBranding: (branding: Record<string, any>) => Promise<boolean>
  updateFeatureFlags: (flags: Record<string, boolean>) => Promise<boolean>
}

const TenantContext = createContext<TenantProviderState | undefined>(undefined)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null)
  const [usage, setUsage] = useState<TenantUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize tenant context when user changes
  useEffect(() => {
    if (user) {
      initializeTenantContext()
    } else {
      resetState()
    }
  }, [user])

  const resetState = () => {
    setTenant(null)
    setTenantContext(null)
    setUsage(null)
    setLoading(false)
    setError(null)
  }

  const initializeTenantContext = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get user profile with tenant information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role, permissions')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setError(profileError?.message || 'Profile not found')
        setLoading(false)
        return
      }

      if (!profile.tenant_id) {
        setError('User not associated with any tenant')
        setLoading(false)
        return
      }

      // Set tenant context
      const context: TenantContext = {
        tenantId: profile.tenant_id,
        userId: user.id,
        role: profile.role,
        permissions: profile.permissions || {}
      }
      setTenantContext(context)

      // Get tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()
      
      if (tenantError || !tenantData) {
        setError(tenantError?.message || 'Tenant not found')
        setLoading(false)
        return
      }

      setTenant(tenantData)

      // Get usage data
      await loadUsage(profile.tenant_id)

    } catch (err) {
      console.error('Error initializing tenant context:', err)
      setError('Failed to initialize tenant context')
    } finally {
      setLoading(false)
    }
  }

  const loadUsage = async (_tenantId: string) => {
    try {
      // For now, create mock usage data
      // In a real implementation, this would call an API endpoint
      const mockUsage: TenantUsage = {
        assets: { current: 0, limit: 1000, percentage: 0 },
        users: { current: 0, limit: 50, percentage: 0 },
        storage: { current: 0, limit: 100, percentage: 0 }
      }
      setUsage(mockUsage)
    } catch (err) {
      console.error('Error loading tenant usage:', err)
    }
  }

  const refreshTenant = async () => {
    if (!tenantContext) return

    try {
      const supabase = createClient()
      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantContext.tenantId)
        .single()
      
      if (error) {
        setError(error.message)
        return
      }

      setTenant(tenantData)
    } catch (err) {
      console.error('Error refreshing tenant:', err)
      setError('Failed to refresh tenant data')
    }
  }

  const refreshUsage = async () => {
    if (!tenantContext) return

    try {
      await loadUsage(tenantContext.tenantId)
    } catch (err) {
      console.error('Error refreshing usage:', err)
    }
  }

  const updateTenantBranding = async (branding: Record<string, any>): Promise<boolean> => {
    if (!tenantContext) return false

    try {
      const response = await fetch('/api/tenant/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding })
      })

      if (response.ok) {
        await refreshTenant()
        return true
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update branding')
        return false
      }
    } catch (err) {
      console.error('Error updating branding:', err)
      setError('Failed to update branding')
      return false
    }
  }

  const updateFeatureFlags = async (flags: Record<string, boolean>): Promise<boolean> => {
    if (!tenantContext) return false

    try {
      const response = await fetch('/api/tenant/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureFlags: flags })
      })

      if (response.ok) {
        await refreshTenant()
        return true
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update feature flags')
        return false
      }
    } catch (err) {
      console.error('Error updating feature flags:', err)
      setError('Failed to update feature flags')
      return false
    }
  }

  const value: TenantProviderState = {
    tenant,
    tenantContext,
    usage,
    loading,
    error,
    refreshTenant,
    refreshUsage,
    updateTenantBranding,
    updateFeatureFlags
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

// Hook to check if user can perform specific actions
export function useTenantLimits() {
  const { tenantContext, usage } = useTenant()

  const canCreateAsset = () => {
    if (!usage || !tenantContext) return false
    return usage.assets.current < usage.assets.limit
  }

  const canCreateUser = () => {
    if (!usage || !tenantContext) return false
    return usage.users.current < usage.users.limit
  }

  const canUploadFile = (sizeInBytes: number) => {
    if (!usage || !tenantContext) return false
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024)
    return usage.storage.current + sizeInGB <= usage.storage.limit
  }

  const getRemainingAssets = () => {
    if (!usage) return 0
    return Math.max(0, usage.assets.limit - usage.assets.current)
  }

  const getRemainingUsers = () => {
    if (!usage) return 0
    return Math.max(0, usage.users.limit - usage.users.current)
  }

  const getRemainingStorage = () => {
    if (!usage) return 0
    return Math.max(0, usage.storage.limit - usage.storage.current)
  }

  return {
    canCreateAsset,
    canCreateUser,
    canUploadFile,
    getRemainingAssets,
    getRemainingUsers,
    getRemainingStorage,
    usage
  }
}

// Hook to check user permissions
export function useTenantPermissions() {
  const { tenantContext } = useTenant()

  const hasRole = (role: string | string[]) => {
    if (!tenantContext) return false
    
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(tenantContext.role) || 
           tenantContext.role === 'owner' || 
           tenantContext.role === 'admin'
  }

  const canManageAssets = () => hasRole(['owner', 'admin', 'manager'])
  const canManageUsers = () => hasRole(['owner', 'admin'])
  const canManageTenant = () => hasRole(['owner'])
  const canViewAnalytics = () => hasRole(['owner', 'admin', 'manager'])
  const canManageIntegrations = () => hasRole(['owner', 'admin'])

  const isOwner = () => tenantContext?.role === 'owner'
  const isAdmin = () => ['owner', 'admin'].includes(tenantContext?.role || '')
  const isManager = () => ['owner', 'admin', 'manager'].includes(tenantContext?.role || '')

  return {
    hasRole,
    canManageAssets,
    canManageUsers,
    canManageTenant,
    canViewAnalytics,
    canManageIntegrations,
    isOwner,
    isAdmin,
    isManager,
    role: tenantContext?.role
  }
}