// =====================================================
// TENANT CONFIGURATION SERVICE
// =====================================================
// Service for managing tenant-specific configurations, branding, and feature flags

import { createClient } from '@/lib/supabase/server'
import { tenantConfig, FeatureFlags, BrandingConfig, TenantSettings } from '@/lib/config/tenant-config'
import { Tenant } from '@/lib/types/database'

export interface TenantConfigurationUpdate {
  branding?: Partial<BrandingConfig>
  settings?: Partial<TenantSettings>
  featureFlags?: Partial<FeatureFlags>
}

export interface TenantConfigurationResult {
  success: boolean
  error?: string
  data?: {
    branding?: BrandingConfig
    settings?: TenantSettings
    featureFlags?: FeatureFlags
  }
}

export class TenantConfigurationService {
  private async getSupabase() {
    return createClient()
  }

  // =====================================================
  // BRANDING MANAGEMENT
  // =====================================================

  /**
   * Update tenant branding configuration
   */
  async updateBranding(
    tenantId: string,
    branding: Partial<BrandingConfig>,
    userId: string
  ): Promise<TenantConfigurationResult> {
    try {
      // Validate branding configuration
      const validation = tenantConfig.validateBranding(branding)
      if (!validation.valid) {
        return {
          success: false,
          error: `Branding validation failed: ${validation.errors.join(', ')}`
        }
      }

      const supabase = await this.getSupabase()
      
      // Get current tenant
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('branding')
        .eq('id', tenantId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Merge with existing branding
      const currentBranding = (tenant?.branding as Partial<BrandingConfig>) || {}
      const updatedBranding = { ...currentBranding, ...branding }

      // Update tenant
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ branding: updatedBranding })
        .eq('id', tenantId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Create audit log
      await this.createConfigurationAuditLog(
        tenantId,
        userId,
        'branding',
        currentBranding,
        updatedBranding
      )

      return {
        success: true,
        data: { branding: tenantConfig.getBrandingConfig({ branding: updatedBranding } as Tenant) }
      }
    } catch (error) {
      console.error('Error updating tenant branding:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tenant branding configuration
   */
  async getBranding(tenantId: string): Promise<TenantConfigurationResult> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('branding, plan')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const branding = tenantConfig.getBrandingConfig(tenant as Tenant)

      return {
        success: true,
        data: { branding }
      }
    } catch (error) {
      console.error('Error getting tenant branding:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate tenant CSS stylesheet
   */
  async generateTenantCSS(tenantId: string): Promise<{ success: boolean; css?: string; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('branding')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const css = tenantConfig.generateTenantCSS(tenant as Tenant)

      return { success: true, css }
    } catch (error) {
      console.error('Error generating tenant CSS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // FEATURE FLAGS MANAGEMENT
  // =====================================================

  /**
   * Update tenant feature flags
   */
  async updateFeatureFlags(
    tenantId: string,
    featureFlags: Partial<FeatureFlags>,
    userId: string
  ): Promise<TenantConfigurationResult> {
    try {
      const supabase = await this.getSupabase()
      
      // Get current tenant to check plan
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('feature_flags, plan')
        .eq('id', tenantId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Validate feature flags for tenant's plan
      const validation = tenantConfig.validateFeatureFlags(featureFlags, tenant?.plan)
      if (!validation.valid) {
        return {
          success: false,
          error: `Feature flags validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Check feature dependencies
      for (const [feature, enabled] of Object.entries(featureFlags)) {
        if (enabled) {
          const dependencyCheck = tenantConfig.validateFeatureDependencies(
            tenant as Tenant,
            feature as keyof FeatureFlags
          )
          if (!dependencyCheck.valid) {
            return {
              success: false,
              error: `Feature ${feature} requires: ${dependencyCheck.missingDependencies.join(', ')}`
            }
          }
        }
      }

      // Merge with existing feature flags
      const currentFlags = (tenant?.feature_flags as Partial<FeatureFlags>) || {}
      const updatedFlags = { ...currentFlags, ...featureFlags }

      // Update tenant
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ feature_flags: updatedFlags })
        .eq('id', tenantId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Create audit log
      await this.createConfigurationAuditLog(
        tenantId,
        userId,
        'feature_flags',
        currentFlags,
        updatedFlags
      )

      return {
        success: true,
        data: { featureFlags: tenantConfig.getFeatureFlags({ ...tenant, feature_flags: updatedFlags } as Tenant) }
      }
    } catch (error) {
      console.error('Error updating feature flags:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tenant feature flags
   */
  async getFeatureFlags(tenantId: string): Promise<TenantConfigurationResult> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('feature_flags, plan')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const featureFlags = tenantConfig.getFeatureFlags(tenant as Tenant)

      return {
        success: true,
        data: { featureFlags }
      }
    } catch (error) {
      console.error('Error getting feature flags:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if tenant has specific feature enabled
   */
  async hasFeature(tenantId: string, feature: keyof FeatureFlags): Promise<{ enabled: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('feature_flags, plan')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { enabled: false, error: error.message }
      }

      const enabled = tenantConfig.isFeatureEnabled(tenant as Tenant, feature)

      return { enabled }
    } catch (error) {
      console.error('Error checking feature:', error)
      return {
        enabled: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // SETTINGS MANAGEMENT
  // =====================================================

  /**
   * Update tenant settings
   */
  async updateSettings(
    tenantId: string,
    settings: Partial<TenantSettings>,
    userId: string
  ): Promise<TenantConfigurationResult> {
    try {
      // Validate settings
      const validation = tenantConfig.validateConfig(settings)
      if (!validation.valid) {
        return {
          success: false,
          error: `Settings validation failed: ${validation.errors.join(', ')}`
        }
      }

      const supabase = await this.getSupabase()
      
      // Get current tenant
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      // Merge with existing settings
      const currentSettings = (tenant?.settings as Partial<TenantSettings>) || {}
      const updatedSettings = { ...currentSettings, ...settings }

      // Update tenant
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ settings: updatedSettings })
        .eq('id', tenantId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Create audit log
      await this.createConfigurationAuditLog(
        tenantId,
        userId,
        'settings',
        currentSettings,
        updatedSettings
      )

      return {
        success: true,
        data: { settings: tenantConfig.getTenantSettings({ settings: updatedSettings } as Tenant) }
      }
    } catch (error) {
      console.error('Error updating tenant settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tenant settings
   */
  async getSettings(tenantId: string): Promise<TenantConfigurationResult> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const settings = tenantConfig.getTenantSettings(tenant as Tenant)

      return {
        success: true,
        data: { settings }
      }
    } catch (error) {
      console.error('Error getting tenant settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // BULK CONFIGURATION MANAGEMENT
  // =====================================================

  /**
   * Update multiple configuration sections at once
   */
  async updateConfiguration(
    tenantId: string,
    updates: TenantConfigurationUpdate,
    userId: string
  ): Promise<TenantConfigurationResult> {
    try {
      const results: Record<string, unknown> = {}
      let hasErrors = false
      const errors: string[] = []

      // Update branding if provided
      if (updates.branding) {
        const brandingResult = await this.updateBranding(tenantId, updates.branding, userId)
        if (brandingResult.success) {
          results.branding = brandingResult.data?.branding
        } else {
          hasErrors = true
          errors.push(`Branding: ${brandingResult.error}`)
        }
      }

      // Update feature flags if provided
      if (updates.featureFlags) {
        const flagsResult = await this.updateFeatureFlags(tenantId, updates.featureFlags, userId)
        if (flagsResult.success) {
          results.featureFlags = flagsResult.data?.featureFlags
        } else {
          hasErrors = true
          errors.push(`Feature flags: ${flagsResult.error}`)
        }
      }

      // Update settings if provided
      if (updates.settings) {
        const settingsResult = await this.updateSettings(tenantId, updates.settings, userId)
        if (settingsResult.success) {
          results.settings = settingsResult.data?.settings
        } else {
          hasErrors = true
          errors.push(`Settings: ${settingsResult.error}`)
        }
      }

      if (hasErrors) {
        return {
          success: false,
          error: errors.join('; '),
          data: Object.keys(results).length > 0 ? results : undefined
        }
      }

      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('Error updating tenant configuration:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get complete tenant configuration
   */
  async getConfiguration(tenantId: string): Promise<TenantConfigurationResult> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('branding, settings, feature_flags, plan')
        .eq('id', tenantId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const fullTenant = tenant as Tenant
      const branding = tenantConfig.getBrandingConfig(fullTenant)
      const settings = tenantConfig.getTenantSettings(fullTenant)
      const featureFlags = tenantConfig.getFeatureFlags(fullTenant)

      return {
        success: true,
        data: {
          branding,
          settings,
          featureFlags
        }
      }
    } catch (error) {
      console.error('Error getting tenant configuration:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // PLAN MANAGEMENT
  // =====================================================

  /**
   * Update tenant plan and adjust feature flags accordingly
   */
  async updatePlan(
    tenantId: string,
    newPlan: string,
    userId: string
  ): Promise<TenantConfigurationResult> {
    try {
      const supabase = await this.getSupabase()
      
      // Get current tenant
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      const oldPlan = tenant?.plan
      const planLimits = tenantConfig.getPlanLimits(newPlan)

      // Update tenant with new plan and limits
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          plan: newPlan,
          asset_limit: planLimits.assets,
          user_limit: planLimits.users,
          storage_limit_gb: planLimits.storage
        })
        .eq('id', tenantId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Create audit log
      await this.createConfigurationAuditLog(
        tenantId,
        userId,
        'plan_change',
        { plan: oldPlan },
        { plan: newPlan, limits: planLimits }
      )

      return { success: true }
    } catch (error) {
      console.error('Error updating tenant plan:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // AUDIT LOGGING
  // =====================================================

  /**
   * Create configuration change audit log
   */
  private async createConfigurationAuditLog(
    tenantId: string,
    userId: string,
    configType: string,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          action: 'update',
          resource_type: 'tenant_configuration',
          resource_id: tenantId,
          before_state: beforeState,
          after_state: afterState,
          user_id: userId,
          compliance_category: 'configuration_management',
          metadata: {
            config_type: configType,
            timestamp: new Date().toISOString()
          }
        })
    } catch (error) {
      console.warn('Failed to create configuration audit log:', error)
    }
  }

  // =====================================================
  // CONFIGURATION EXPORT/IMPORT
  // =====================================================

  /**
   * Export tenant configuration for backup or migration
   */
  async exportConfiguration(tenantId: string): Promise<{
    success: boolean
    data?: any
    error?: string
  }> {
    try {
      const configResult = await this.getConfiguration(tenantId)
      if (!configResult.success) {
        return { success: false, error: configResult.error }
      }

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tenantId,
        configuration: configResult.data
      }

      return { success: true, data: exportData }
    } catch (error) {
      console.error('Error exporting configuration:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Import tenant configuration from backup
   */
  async importConfiguration(
    tenantId: string,
    configData: Record<string, unknown>,
    userId: string
  ): Promise<TenantConfigurationResult> {
    try {
      // Validate import data structure
      if (!configData.configuration) {
        return { success: false, error: 'Invalid configuration data format' }
      }

      const { branding, settings, featureFlags } = (configData.configuration as any)

      // Import configuration
      const result = await this.updateConfiguration(
        tenantId,
        { branding, settings, featureFlags },
        userId
      )

      // Create import audit log
      if (result.success) {
        await this.createConfigurationAuditLog(
          tenantId,
          userId,
          'configuration_import',
          {},
          { imported_from: configData.exportedAt || 'unknown' }
        )
      }

      return result
    } catch (error) {
      console.error('Error importing configuration:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const tenantConfiguration = new TenantConfigurationService()