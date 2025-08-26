// =====================================================
// TENANT CONFIGURATION MANAGEMENT
// =====================================================
// Utilities for managing tenant-specific configurations, branding, and feature flags

import { Tenant } from '@/lib/types/database'

// =====================================================
// FEATURE FLAGS
// =====================================================

export interface FeatureFlags {
  // Core Features
  advanced_analytics: boolean
  iot_integration: boolean
  geofencing: boolean
  predictive_maintenance: boolean
  
  // Integrations
  slack_integration: boolean
  teams_integration: boolean
  webhook_notifications: boolean
  api_access: boolean
  
  // Advanced Features
  custom_fields: boolean
  workflow_automation: boolean
  advanced_reporting: boolean
  audit_logs: boolean
  
  // Mobile Features
  mobile_app: boolean
  offline_mode: boolean
  push_notifications: boolean
  
  // Security Features
  sso_integration: boolean
  mfa_enforcement: boolean
  ip_restrictions: boolean
  session_management: boolean
  
  // Compliance Features
  gdpr_tools: boolean
  data_retention: boolean
  compliance_reporting: boolean
  
  // Customization
  custom_branding: boolean
  white_labeling: boolean
  custom_domains: boolean
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core Features
  advanced_analytics: false,
  iot_integration: false,
  geofencing: false,
  predictive_maintenance: false,
  
  // Integrations
  slack_integration: false,
  teams_integration: false,
  webhook_notifications: false,
  api_access: false,
  
  // Advanced Features
  custom_fields: false,
  workflow_automation: false,
  advanced_reporting: false,
  audit_logs: false,
  
  // Mobile Features
  mobile_app: true,
  offline_mode: false,
  push_notifications: false,
  
  // Security Features
  sso_integration: false,
  mfa_enforcement: false,
  ip_restrictions: false,
  session_management: true,
  
  // Compliance Features
  gdpr_tools: false,
  data_retention: false,
  compliance_reporting: false,
  
  // Customization
  custom_branding: false,
  white_labeling: false,
  custom_domains: false
}

// Feature flags by plan
export const PLAN_FEATURE_FLAGS: Record<string, Partial<FeatureFlags>> = {
  starter: {
    mobile_app: true,
    session_management: true,
    api_access: true
  },
  professional: {
    mobile_app: true,
    session_management: true,
    api_access: true,
    advanced_analytics: true,
    iot_integration: true,
    geofencing: true,
    slack_integration: true,
    teams_integration: true,
    webhook_notifications: true,
    custom_fields: true,
    advanced_reporting: true,
    push_notifications: true,
    custom_branding: true
  },
  enterprise: {
    // All features enabled
    ...Object.keys(DEFAULT_FEATURE_FLAGS).reduce((acc, key) => {
      acc[key as keyof FeatureFlags] = true
      return acc
    }, {} as FeatureFlags)
  }
}

// =====================================================
// BRANDING CONFIGURATION
// =====================================================

export interface BrandingConfig {
  // Company Information
  companyName: string
  logoUrl?: string
  faviconUrl?: string
  
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  
  // Typography
  fontFamily?: string
  headingFont?: string
  
  // Layout
  sidebarColor?: string
  headerColor?: string
  
  // Custom CSS
  customCss?: string
  
  // Email Branding
  emailLogo?: string
  emailFooter?: string
  
  // White Labeling
  hideAssetTrackerBranding?: boolean
  customDomain?: string
  
  // Contact Information
  supportEmail?: string
  supportPhone?: string
  website?: string
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'AssetTracker Pro',
  primaryColor: '#2563eb',
  secondaryColor: '#f1f5f9',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter, sans-serif',
  sidebarColor: '#f8fafc',
  headerColor: '#ffffff'
}

// =====================================================
// TENANT SETTINGS
// =====================================================

export interface TenantSettings {
  // General Settings
  timezone: string
  dateFormat: string
  timeFormat: string
  currency: string
  language: string
  
  // Asset Settings
  assetIdFormat: string
  autoGenerateAssetIds: boolean
  requireAssetApproval: boolean
  enableAssetHierarchy: boolean
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  slackNotifications: boolean
  teamsNotifications: boolean
  
  // Security Settings
  sessionTimeout: number // minutes
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
  
  // Data Settings
  dataRetentionDays: number
  enableAuditLogs: boolean
  enableDataExport: boolean
  
  // Integration Settings
  apiRateLimit: number // requests per minute
  webhookRetries: number
  
  // Mobile Settings
  allowMobileAccess: boolean
  requireMobileAuth: boolean
  
  // Maintenance Settings
  maintenanceMode: boolean
  maintenanceMessage?: string
}

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  // General Settings
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  language: 'en',
  
  // Asset Settings
  assetIdFormat: 'AST-{YYYY}-{####}',
  autoGenerateAssetIds: true,
  requireAssetApproval: false,
  enableAssetHierarchy: true,
  
  // Notification Settings
  emailNotifications: true,
  pushNotifications: false,
  slackNotifications: false,
  teamsNotifications: false,
  
  // Security Settings
  sessionTimeout: 480, // 8 hours
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false
  },
  
  // Data Settings
  dataRetentionDays: 2555, // 7 years
  enableAuditLogs: true,
  enableDataExport: true,
  
  // Integration Settings
  apiRateLimit: 100,
  webhookRetries: 3,
  
  // Mobile Settings
  allowMobileAccess: true,
  requireMobileAuth: true,
  
  // Maintenance Settings
  maintenanceMode: false
}

// =====================================================
// CONFIGURATION MANAGER
// =====================================================

export class TenantConfigManager {
  /**
   * Get merged feature flags for tenant
   */
  static getFeatureFlags(tenant: Tenant): FeatureFlags {
    const planFlags = PLAN_FEATURE_FLAGS[tenant.plan] || {}
    const customFlags = (tenant.feature_flags as Partial<FeatureFlags>) || {}
    
    return {
      ...DEFAULT_FEATURE_FLAGS,
      ...planFlags,
      ...customFlags
    }
  }

  /**
   * Get merged branding configuration for tenant
   */
  static getBrandingConfig(tenant: Tenant): BrandingConfig {
    const customBranding = (tenant.branding as Partial<BrandingConfig>) || {}
    
    return {
      ...DEFAULT_BRANDING,
      ...customBranding
    }
  }

  /**
   * Get merged settings for tenant
   */
  static getTenantSettings(tenant: Tenant): TenantSettings {
    const customSettings = (tenant.settings as Partial<TenantSettings>) || {}
    
    return {
      ...DEFAULT_TENANT_SETTINGS,
      ...customSettings
    }
  }

  /**
   * Check if feature is enabled for tenant
   */
  static isFeatureEnabled(tenant: Tenant, feature: keyof FeatureFlags): boolean {
    const flags = this.getFeatureFlags(tenant)
    return flags[feature] === true
  }

  /**
   * Get CSS variables for tenant branding
   */
  static getBrandingCSSVariables(tenant: Tenant): Record<string, string> {
    const branding = this.getBrandingConfig(tenant)
    
    return {
      '--brand-primary': branding.primaryColor,
      '--brand-secondary': branding.secondaryColor,
      '--brand-accent': branding.accentColor,
      '--brand-background': branding.backgroundColor,
      '--brand-text': branding.textColor,
      '--brand-sidebar': branding.sidebarColor || branding.secondaryColor,
      '--brand-header': branding.headerColor || branding.backgroundColor,
      '--brand-font': branding.fontFamily || 'Inter, sans-serif',
      '--brand-heading-font': branding.headingFont || branding.fontFamily || 'Inter, sans-serif'
    }
  }

  /**
   * Get tenant-specific CSS stylesheet
   */
  static generateTenantCSS(tenant: Tenant): string {
    const variables = this.getBrandingCSSVariables(tenant)
    const branding = this.getBrandingConfig(tenant)
    
    let css = ':root {\n'
    Object.entries(variables).forEach(([key, value]) => {
      css += `  ${key}: ${value};\n`
    })
    css += '}\n\n'
    
    // Add custom CSS if provided
    if (branding.customCss) {
      css += branding.customCss + '\n'
    }
    
    // Add logo styling if provided
    if (branding.logoUrl) {
      css += `
.tenant-logo {
  background-image: url('${branding.logoUrl}');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
`
    }
    
    return css
  }

  /**
   * Validate branding configuration
   */
  static validateBranding(branding: Partial<BrandingConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate colors (hex format)
    const colorFields = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor']
    colorFields.forEach(field => {
      const color = branding[field as keyof BrandingConfig]
      if (color && typeof color === 'string' && !/^#[0-9A-F]{6}$/i.test(color)) {
        errors.push(`${field} must be a valid hex color (e.g., #FF0000)`)
      }
    })

    // Validate URLs
    const urlFields = ['logoUrl', 'faviconUrl', 'emailLogo', 'website']
    urlFields.forEach(field => {
      const url = branding[field as keyof BrandingConfig]
      if (url && typeof url === 'string') {
        try {
          new URL(url)
        } catch {
          errors.push(`${field} must be a valid URL`)
        }
      }
    })

    // Validate email
    if (branding.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(branding.supportEmail)) {
      errors.push('Support email must be a valid email address')
    }

    // Validate custom CSS (basic check)
    if (branding.customCss && branding.customCss.length > 50000) {
      errors.push('Custom CSS must be less than 50KB')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate asset ID based on tenant format
   */
  static generateAssetId(tenant: Tenant, sequence: number): string {
    const settings = this.getTenantSettings(tenant)
    const format = settings.assetIdFormat
    
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    return format
      .replace('{YYYY}', year.toString())
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace('{####}', String(sequence).padStart(4, '0'))
      .replace('{###}', String(sequence).padStart(3, '0'))
      .replace('{##}', String(sequence).padStart(2, '0'))
  }

  /**
   * Validate tenant configuration
   */
  static validateConfig(config: Partial<TenantSettings>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate timezone
    if (config.timezone) {
      try {
        // Try to create a date with the timezone to validate it
        new Intl.DateTimeFormat('en', { timeZone: config.timezone })
      } catch {
        errors.push('Invalid timezone')
      }
    }

    // Validate session timeout
    if (config.sessionTimeout && (config.sessionTimeout < 5 || config.sessionTimeout > 1440)) {
      errors.push('Session timeout must be between 5 and 1440 minutes')
    }

    // Validate password policy
    if (config.passwordPolicy) {
      if (config.passwordPolicy.minLength < 6 || config.passwordPolicy.minLength > 128) {
        errors.push('Password minimum length must be between 6 and 128 characters')
      }
    }

    // Validate data retention
    if (config.dataRetentionDays && config.dataRetentionDays < 30) {
      errors.push('Data retention must be at least 30 days')
    }

    // Validate API rate limit
    if (config.apiRateLimit && (config.apiRateLimit < 10 || config.apiRateLimit > 10000)) {
      errors.push('API rate limit must be between 10 and 10000 requests per minute')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get plan limits
   */
  static getPlanLimits(plan: string): { assets: number; users: number; storage: number } {
    const limits = {
      starter: { assets: 1000, users: 5, storage: 5 },
      professional: { assets: 10000, users: 25, storage: 50 },
      enterprise: { assets: 100000, users: 100, storage: 500 },
      custom: { assets: 1000000, users: 1000, storage: 5000 }
    }

    return limits[plan as keyof typeof limits] || limits.starter
  }

  /**
   * Check if tenant can access feature based on plan
   */
  static canAccessFeature(tenant: Tenant, feature: keyof FeatureFlags): boolean {
    const planFlags = PLAN_FEATURE_FLAGS[tenant.plan] || {}
    const customFlags = (tenant.feature_flags as Partial<FeatureFlags>) || {}
    
    // Check if explicitly enabled in custom flags
    if (customFlags[feature] === true) return true
    
    // Check if enabled in plan
    if (planFlags[feature] === true) return true
    
    // Check if it's a default feature
    return DEFAULT_FEATURE_FLAGS[feature] === true
  }

  /**
   * Get feature flag with fallback and validation
   */
  static getFeatureFlag(tenant: Tenant, feature: keyof FeatureFlags, defaultValue?: boolean): boolean {
    const flags = this.getFeatureFlags(tenant)
    const value = flags[feature]
    
    if (typeof value === 'boolean') {
      return value
    }
    
    return defaultValue ?? DEFAULT_FEATURE_FLAGS[feature]
  }

  /**
   * Validate feature flags configuration
   */
  static validateFeatureFlags(flags: Partial<FeatureFlags>, plan: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const planFlags = PLAN_FEATURE_FLAGS[plan] || {}
    
    Object.entries(flags).forEach(([key, value]) => {
      // Check if feature exists
      if (!(key in DEFAULT_FEATURE_FLAGS)) {
        errors.push(`Unknown feature flag: ${key}`)
        return
      }
      
      // Check if value is boolean
      if (typeof value !== 'boolean') {
        errors.push(`Feature flag ${key} must be a boolean value`)
        return
      }
      
      // Check if feature is allowed for plan
      if (value === true && !planFlags[key as keyof FeatureFlags] && !DEFAULT_FEATURE_FLAGS[key as keyof FeatureFlags]) {
        errors.push(`Feature ${key} is not available for plan ${plan}`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get feature flag dependencies
   */
  static getFeatureDependencies(feature: keyof FeatureFlags): (keyof FeatureFlags)[] {
    const dependencies: Record<keyof FeatureFlags, (keyof FeatureFlags)[]> = {
      // Advanced features depend on basic ones
      predictive_maintenance: ['iot_integration'],
      advanced_reporting: ['advanced_analytics'],
      workflow_automation: ['advanced_analytics'],
      compliance_reporting: ['audit_logs'],
      white_labeling: ['custom_branding'],
      
      // All other features have no dependencies
      advanced_analytics: [],
      iot_integration: [],
      geofencing: [],
      slack_integration: [],
      teams_integration: [],
      webhook_notifications: [],
      api_access: [],
      custom_fields: [],
      audit_logs: [],
      mobile_app: [],
      offline_mode: [],
      push_notifications: [],
      sso_integration: [],
      mfa_enforcement: [],
      ip_restrictions: [],
      session_management: [],
      gdpr_tools: [],
      data_retention: [],
      custom_branding: [],
      custom_domains: []
    }
    
    return dependencies[feature] || []
  }

  /**
   * Check if all feature dependencies are met
   */
  static validateFeatureDependencies(tenant: Tenant, feature: keyof FeatureFlags): { valid: boolean; missingDependencies: string[] } {
    const dependencies = this.getFeatureDependencies(feature)
    const flags = this.getFeatureFlags(tenant)
    const missingDependencies: string[] = []
    
    dependencies.forEach(dependency => {
      if (!flags[dependency]) {
        missingDependencies.push(dependency)
      }
    })
    
    return {
      valid: missingDependencies.length === 0,
      missingDependencies
    }
  }
}

// Export default instance
export const tenantConfig = TenantConfigManager