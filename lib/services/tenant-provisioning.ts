// =====================================================
// TENANT PROVISIONING SERVICE
// =====================================================
// Service for provisioning new tenants and managing tenant lifecycle

import { createClient } from '@/lib/supabase/server'
import { 
  Tenant, 
  TenantInsert, 
  Profile, 
  ProfileInsert,
  AssetCategoryInsert 
} from '@/lib/types/database'
import { tenantConfig, DEFAULT_TENANT_SETTINGS, DEFAULT_BRANDING } from '@/lib/config/tenant-config'

export interface TenantProvisioningRequest {
  // Tenant Information
  name: string
  slug: string
  plan?: string
  
  // Owner Information
  ownerEmail: string
  ownerName: string
  ownerId: string // Supabase auth user ID
  
  // Optional Configuration
  branding?: Record<string, any>
  settings?: Record<string, any>
  featureFlags?: Record<string, boolean>
  
  // Billing Information (optional)
  stripeCustomerId?: string
  trialDays?: number
}

export interface TenantProvisioningResult {
  success: boolean
  tenant?: Tenant
  profile?: Profile
  error?: string
  details?: {
    tenantCreated: boolean
    profileCreated: boolean
    categoriesCreated: boolean
    defaultDataCreated: boolean
  }
}

export class TenantProvisioningService {
  private async getSupabase() {
    return createClient()
  }

  /**
   * Provision a new tenant with all required setup
   */
  async provisionTenant(request: TenantProvisioningRequest): Promise<TenantProvisioningResult> {
    const result: TenantProvisioningResult = {
      success: false,
      details: {
        tenantCreated: false,
        profileCreated: false,
        categoriesCreated: false,
        defaultDataCreated: false
      }
    }

    const startTime = Date.now()
    let rollbackRequired = false

    try {
      // Enhanced validation
      const validation = await this.validateProvisioningRequest(request)
      if (!validation.valid) {
        return { ...result, error: validation.error }
      }

      console.log('Starting tenant provisioning for:', request.name)

      // 1. Create tenant with enhanced error handling
      const tenant = await this.createTenantWithRetry(request)
      if (!tenant) {
        return { ...result, error: 'Failed to create tenant after retries' }
      }
      result.tenant = tenant
      result.details!.tenantCreated = true
      rollbackRequired = true
      console.log('Tenant created:', tenant.id)

      // 2. Create owner profile with validation
      const profile = await this.createOwnerProfileWithValidation(request, tenant.id)
      if (!profile) {
        await this.rollbackTenant(tenant.id)
        return { ...result, error: 'Failed to create owner profile' }
      }
      result.profile = profile
      result.details!.profileCreated = true
      console.log('Owner profile created:', profile.id)

      // 3. Set up tenant context for subsequent operations
      await this.setupTenantContext(profile.id, tenant.id)

      // 4. Create default asset categories with error handling
      try {
        const categoriesCreated = await this.createDefaultCategories(tenant.id, profile.id)
        result.details!.categoriesCreated = categoriesCreated
        if (categoriesCreated) {
          console.log('Default categories created')
        }
      } catch (error) {
        console.warn('Non-critical error creating categories:', error)
      }

      // 5. Create default data and settings
      try {
        const defaultDataCreated = await this.createDefaultData(tenant.id, profile.id)
        result.details!.defaultDataCreated = defaultDataCreated
        if (defaultDataCreated) {
          console.log('Default data created')
        }
      } catch (error) {
        console.warn('Non-critical error creating default data:', error)
      }

      // 6. Initialize tenant security settings
      await this.initializeTenantSecurity(tenant.id)

      // 7. Create audit log entry
      await this.createProvisioningAuditLog(tenant.id, profile.id, request)

      // 8. Send welcome email (non-blocking)
      this.sendWelcomeEmail(request, tenant).catch(error => {
        console.warn('Failed to send welcome email:', error)
      })

      const processingTime = Date.now() - startTime
      result.success = true
      console.log(`Tenant provisioning completed successfully: ${tenant.id} (${processingTime}ms)`)
      
      return result

    } catch (error) {
      console.error('Error during tenant provisioning:', error)
      
      // Enhanced rollback with detailed logging
      if (rollbackRequired && result.tenant) {
        console.log('Initiating rollback for tenant:', result.tenant.id)
        await this.rollbackTenant(result.tenant.id)
      }

      return {
        ...result,
        error: error instanceof Error ? error.message : 'Unknown provisioning error'
      }
    }
  }

  /**
   * Create tenant with retry logic
   */
  private async createTenantWithRetry(request: TenantProvisioningRequest, maxRetries: number = 3): Promise<Tenant | null> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tenant = await this.createTenant(request)
        if (tenant) return tenant
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`Tenant creation attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    console.error('All tenant creation attempts failed:', lastError)
    return null
  }

  /**
   * Create owner profile with enhanced validation
   */
  private async createOwnerProfileWithValidation(request: TenantProvisioningRequest, tenantId: string): Promise<Profile | null> {
    try {
      // Check if user already exists
      const supabase = await this.getSupabase()
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('id', request.ownerId)
        .single()

      if (existingProfile) {
        if (existingProfile.tenant_id) {
          throw new Error('User already belongs to another tenant')
        }
        
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update({
            tenant_id: tenantId,
            role: 'owner',
            is_owner: true,
            full_name: request.ownerName,
            email: request.ownerEmail
          })
          .eq('id', request.ownerId)
          .select()
          .single()

        if (error) {
          console.error('Error updating existing profile:', error)
          return null
        }

        return data
      } else {
        // Create new profile
        return await this.createOwnerProfile(request, tenantId)
      }
    } catch (error) {
      console.error('Error in profile validation:', error)
      return null
    }
  }

  /**
   * Set up tenant context for operations
   */
  private async setupTenantContext(userId: string, tenantId: string): Promise<void> {
    try {
      const { tenantService } = await import('@/lib/services/tenant-service')
      await tenantService.setTenantContext(userId, tenantId)
    } catch (error) {
      console.warn('Failed to set tenant context:', error)
    }
  }

  /**
   * Initialize tenant security settings
   */
  private async initializeTenantSecurity(tenantId: string): Promise<void> {
    try {
      // Create default security policies
      const securitySettings = {
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: false
        },
        session_timeout: 480, // 8 hours
        max_failed_attempts: 5,
        lockout_duration: 900, // 15 minutes
        mfa_enforcement: false,
        ip_restrictions: []
      }

      const supabase = await this.getSupabase()
      await supabase
        .from('tenants')
        .update({
          settings: {
            security: securitySettings,
            initialized_at: new Date().toISOString()
          }
        })
        .eq('id', tenantId)

    } catch (error) {
      console.warn('Failed to initialize security settings:', error)
    }
  }

  /**
   * Create provisioning audit log
   */
  private async createProvisioningAuditLog(tenantId: string, userId: string, request: TenantProvisioningRequest): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          action: 'create',
          resource_type: 'tenant',
          resource_id: tenantId,
          after_state: {
            tenant_name: request.name,
            plan: request.plan || 'starter',
            owner_email: request.ownerEmail,
            provisioning_method: 'automated'
          },
          user_id: userId,
          compliance_category: 'tenant_management'
        })
    } catch (error) {
      console.warn('Failed to create audit log:', error)
    }
  }

  /**
   * Validate provisioning request
   */
  private async validateProvisioningRequest(request: TenantProvisioningRequest): Promise<{ valid: boolean; error?: string }> {
    // Check required fields
    if (!request.name || !request.slug || !request.ownerEmail || !request.ownerName || !request.ownerId) {
      return { valid: false, error: 'Missing required fields' }
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(request.slug)) {
      return { valid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' }
    }

    // Check if slug is available
    const supabase = await this.getSupabase()
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', request.slug)
      .single()

    if (existingTenant) {
      return { valid: false, error: 'Slug already exists' }
    }

    // Check if user already has a tenant
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', request.ownerId)
      .single()

    if (existingProfile?.tenant_id) {
      return { valid: false, error: 'User already belongs to a tenant' }
    }

    return { valid: true }
  }

  /**
   * Create tenant record
   */
  private async createTenant(request: TenantProvisioningRequest): Promise<Tenant | null> {
    try {
      const planLimits = tenantConfig.getPlanLimits(request.plan || 'starter')
      
      const tenantData: TenantInsert = {
        name: request.name,
        slug: request.slug,
        status: 'trial',
        plan: (request.plan as any) || 'starter',
        
        // Billing
        stripe_customer_id: request.stripeCustomerId,
        trial_ends_at: request.trialDays 
          ? new Date(Date.now() + request.trialDays * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days default
        
        // Configuration
        settings: {
          ...DEFAULT_TENANT_SETTINGS,
          ...request.settings,
          provisioned_at: new Date().toISOString()
        },
        branding: {
          ...DEFAULT_BRANDING,
          companyName: request.name,
          ...request.branding
        },
        feature_flags: request.featureFlags || {},
        
        // Limits
        asset_limit: planLimits.assets,
        user_limit: planLimits.users,
        storage_limit_gb: planLimits.storage,
        
        created_by: request.ownerId
      }

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single()

      if (error) {
        console.error('Error creating tenant:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Unexpected error creating tenant:', error)
      return null
    }
  }

  /**
   * Create owner profile
   */
  private async createOwnerProfile(request: TenantProvisioningRequest, tenantId: string): Promise<Profile | null> {
    try {
      const profileData: ProfileInsert = {
        id: request.ownerId,
        tenant_id: tenantId,
        email: request.ownerEmail,
        full_name: request.ownerName,
        role: 'owner',
        is_owner: true,
        permissions: {},
        preferences: {
          onboarding_completed: false,
          tour_completed: false
        },
        timezone: 'UTC',
        language: 'en'
      }

      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating owner profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Unexpected error creating owner profile:', error)
      return null
    }
  }

  /**
   * Create default asset categories
   */
  private async createDefaultCategories(tenantId: string, _createdBy: string): Promise<boolean> {
    try {
      const defaultCategories: AssetCategoryInsert[] = [
        {
          tenant_id: tenantId,
          name: 'IT Equipment',
          description: 'Computers, servers, networking equipment',
          icon: 'computer',
          color: '#3b82f6',
          custom_fields: {}
        },
        {
          tenant_id: tenantId,
          name: 'Furniture',
          description: 'Office furniture and fixtures',
          icon: 'chair',
          color: '#8b5cf6',
          custom_fields: {}
        },
        {
          tenant_id: tenantId,
          name: 'Vehicles',
          description: 'Company vehicles and transportation',
          icon: 'truck',
          color: '#10b981',
          custom_fields: {}
        },
        {
          tenant_id: tenantId,
          name: 'Machinery',
          description: 'Industrial machinery and equipment',
          icon: 'cog',
          color: '#f59e0b',
          custom_fields: {}
        },
        {
          tenant_id: tenantId,
          name: 'Tools',
          description: 'Hand tools and power tools',
          icon: 'wrench',
          color: '#ef4444',
          custom_fields: {}
        }
      ]

      const supabase = await this.getSupabase()
      const { error } = await supabase
        .from('asset_categories')
        .insert(defaultCategories)

      if (error) {
        console.error('Error creating default categories:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error creating default categories:', error)
      return false
    }
  }

  /**
   * Create default data and configurations
   */
  private async createDefaultData(tenantId: string, createdBy: string): Promise<boolean> {
    try {
      // Create sample geofence (optional)
      const sampleGeofence = {
        tenant_id: tenantId,
        name: 'Main Office',
        description: 'Primary office location',
        geometry: 'POLYGON((-122.4194 37.7749, -122.4094 37.7749, -122.4094 37.7849, -122.4194 37.7849, -122.4194 37.7749))',
        rules: {
          business_hours: { start: '08:00', end: '18:00' },
          alert_after_hours: true
        },
        status: 'draft',
        created_by: createdBy
      }

      const supabase = await this.getSupabase()
      await supabase
        .from('geofences')
        .insert(sampleGeofence)

      // Create data retention policy
      const retentionPolicy = {
        tenant_id: tenantId,
        name: 'Default Asset History Retention',
        description: 'Retain asset history for 7 years for compliance',
        table_name: 'asset_history',
        retention_period_days: 2555, // 7 years
        conditions: {},
        enabled: true,
        created_by: createdBy
      }

      await supabase
        .from('data_retention_policies')
        .insert(retentionPolicy)

      return true
    } catch (error) {
      console.error('Error creating default data:', error)
      return false
    }
  }

  /**
   * Send welcome email to new tenant owner
   */
  private async sendWelcomeEmail(request: TenantProvisioningRequest, tenant: Tenant): Promise<void> {
    try {
      // This would integrate with your email service
      console.log('Sending welcome email to:', request.ownerEmail)
      
      // TODO: Implement email sending
      // await emailService.sendWelcomeEmail({
      //   to: request.ownerEmail,
      //   tenantName: tenant.name,
      //   ownerName: request.ownerName,
      //   loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
      // })
      
    } catch (error) {
      console.error('Error sending welcome email:', error)
      // Don't fail provisioning for email errors
    }
  }

  /**
   * Rollback tenant creation in case of errors
   */
  private async rollbackTenant(tenantId: string): Promise<void> {
    try {
      console.log('Rolling back tenant creation:', tenantId)
      
      // Delete in reverse order of creation
      const supabase = await this.getSupabase()
      await supabase.from('data_retention_policies').delete().eq('tenant_id', tenantId)
      await supabase.from('geofences').delete().eq('tenant_id', tenantId)
      await supabase.from('asset_categories').delete().eq('tenant_id', tenantId)
      await supabase.from('profiles').delete().eq('tenant_id', tenantId)
      await supabase.from('tenants').delete().eq('id', tenantId)
      
      console.log('Tenant rollback completed')
    } catch (error) {
      console.error('Error during tenant rollback:', error)
    }
  }

  /**
   * Deprovision tenant with comprehensive cleanup and data retention
   */
  async deprovisionTenant(
    tenantId: string, 
    reason: string, 
    options: {
      immediate?: boolean
      retainData?: boolean
      notifyUsers?: boolean
      gracePeriodDays?: number
    } = {}
  ): Promise<{ success: boolean; error?: string; details?: any }> {
    const {
      immediate = false,
      retainData = true,
      notifyUsers = true,
      gracePeriodDays = 30
    } = options

    try {
      console.log(`Starting tenant deprovisioning: ${tenantId}`, { reason, options })

      // 1. Validate tenant exists and get current state
      const supabase = await this.getSupabase()
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single()

      if (tenantError || !tenant) {
        return { success: false, error: 'Tenant not found' }
      }

      if (tenant.status === 'cancelled') {
        return { success: false, error: 'Tenant already deprovisioned' }
      }

      // 2. Get all tenant users for notifications
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('tenant_id', tenantId)

      // 3. Create deprovisioning audit log
      await this.createDeprovisioningAuditLog(tenantId, reason, options)

      // 4. Update tenant status and settings
      const deprovisioningDate = new Date()
      const finalDeletionDate = immediate 
        ? deprovisioningDate 
        : new Date(deprovisioningDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)

      const updatedSettings = {
        ...(tenant.settings as any || {}),
        deprovisioned_at: deprovisioningDate.toISOString(),
        deprovisioning_reason: reason,
        final_deletion_date: finalDeletionDate.toISOString(),
        retain_data: retainData,
        grace_period_days: gracePeriodDays,
        immediate_deletion: immediate
      }

      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          status: immediate ? 'cancelled' : 'suspended',
          settings: updatedSettings
        })
        .eq('id', tenantId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // 5. Handle user accounts
      if (immediate) {
        // Immediately lock all users
        await supabase
          .from('profiles')
          .update({ 
            locked_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('tenant_id', tenantId)
      } else {
        // Set future lock date
        await supabase
          .from('profiles')
          .update({ 
            locked_until: finalDeletionDate.toISOString()
          })
          .eq('tenant_id', tenantId)
      }

      // 6. Disable IoT devices and integrations
      await this.disableTenantIntegrations(tenantId)

      // 7. Send notifications to users
      if (notifyUsers && users) {
        await this.sendDeprovisioningNotifications(users, tenant, {
          reason,
          immediate,
          gracePeriodDays,
          finalDeletionDate
        })
      }

      // 8. Schedule data cleanup if not retaining
      if (!retainData) {
        await this.scheduleDataCleanup(tenantId, finalDeletionDate)
      }

      const result = {
        success: true,
        details: {
          tenantId,
          status: immediate ? 'cancelled' : 'suspended',
          usersAffected: users?.length || 0,
          finalDeletionDate: finalDeletionDate.toISOString(),
          dataRetained: retainData
        }
      }

      console.log('Tenant deprovisioning completed:', result.details)
      return result

    } catch (error) {
      console.error('Error deprovisioning tenant:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Create deprovisioning audit log
   */
  private async createDeprovisioningAuditLog(tenantId: string, reason: string, options: any): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          action: 'delete',
          resource_type: 'tenant',
          resource_id: tenantId,
          before_state: { status: 'active' },
          after_state: {
            status: options.immediate ? 'cancelled' : 'suspended',
            reason,
            options,
            deprovisioned_at: new Date().toISOString()
          },
          compliance_category: 'tenant_management'
        })
    } catch (error) {
      console.warn('Failed to create deprovisioning audit log:', error)
    }
  }

  /**
   * Disable tenant integrations and IoT devices
   */
  private async disableTenantIntegrations(tenantId: string): Promise<void> {
    try {
      // Disable IoT devices
      const supabase = await this.getSupabase()
      await supabase
        .from('iot_devices')
        .update({ status: 'inactive' })
        .eq('tenant_id', tenantId)

      // Disable geofences
      await supabase
        .from('geofences')
        .update({ status: 'inactive' })
        .eq('tenant_id', tenantId)

      console.log('Tenant integrations disabled for:', tenantId)
    } catch (error) {
      console.warn('Error disabling tenant integrations:', error)
    }
  }

  /**
   * Send deprovisioning notifications to users
   */
  private async sendDeprovisioningNotifications(
    users: any[],
    _tenant: any,
    _details: any
  ): Promise<void> {
    try {
      // This would integrate with your email service
      console.log('Sending deprovisioning notifications to users:', users.length)
      
      // TODO: Implement email notifications
      // for (const user of users) {
      //   await emailService.sendDeprovisioningNotification({
      //     to: user.email,
      //     tenantName: tenant.name,
      //     userName: user.full_name,
      //     reason: details.reason,
      //     immediate: details.immediate,
      //     gracePeriodDays: details.gracePeriodDays,
      //     finalDeletionDate: details.finalDeletionDate
      //   })
      // }
      
    } catch (error) {
      console.error('Error sending deprovisioning notifications:', error)
    }
  }

  /**
   * Schedule data cleanup for future execution
   */
  private async scheduleDataCleanup(tenantId: string, deletionDate: Date): Promise<void> {
    try {
      // Create data retention policy for cleanup
      const supabase = await this.getSupabase()
      await supabase
        .from('data_retention_policies')
        .insert({
          tenant_id: tenantId,
          name: 'Tenant Deprovisioning Cleanup',
          description: 'Automated cleanup after tenant deprovisioning',
          table_name: 'all_tenant_data',
          retention_period_days: 0,
          conditions: { tenant_id: tenantId },
          enabled: true,
          next_run_at: deletionDate.toISOString(),
          created_by: 'system'
        })

      console.log('Data cleanup scheduled for:', deletionDate.toISOString())
    } catch (error) {
      console.warn('Error scheduling data cleanup:', error)
    }
  }

  /**
   * Get tenant provisioning status
   */
  async getProvisioningStatus(tenantId: string): Promise<{
    status: 'provisioning' | 'active' | 'suspended' | 'cancelled'
    details: Record<string, any>
  }> {
    try {
      const supabase = await this.getSupabase()
      const { data: tenant } = await supabase
        .from('tenants')
        .select('status, settings, created_at')
        .eq('id', tenantId)
        .single()

      if (!tenant) {
        return { status: 'cancelled', details: { error: 'Tenant not found' } }
      }

      const settings = tenant.settings as any || {}
      
      return {
        status: tenant.status as any,
        details: {
          provisioned_at: settings.provisioned_at,
          deprovisioned_at: settings.deprovisioned_at,
          deprovisioning_reason: settings.deprovisioning_reason,
          created_at: tenant.created_at
        }
      }
    } catch (error) {
      console.error('Error getting provisioning status:', error)
      return { 
        status: 'cancelled', 
        details: { error: 'Failed to get status' } 
      }
    }
  }
}

// Export singleton instance
export const tenantProvisioning = new TenantProvisioningService()