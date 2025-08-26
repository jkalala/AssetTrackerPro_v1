// =====================================================
// ENTERPRISE ASSET MANAGEMENT PLATFORM - DATABASE TYPES
// =====================================================
// TypeScript types that match the enhanced database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// ENUM TYPES
// =====================================================

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise' | 'custom'
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'lost' | 'damaged' | 'disposed' | 'reserved'
export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production'
export type IoTDeviceType = 'gps_tracker' | 'temperature_sensor' | 'humidity_sensor' | 'vibration_sensor' | 'rfid_reader' | 'beacon'
export type IoTProtocol = 'mqtt' | 'lorawan' | 'sigfox' | 'wifi' | 'bluetooth' | 'cellular'
export type DeviceStatus = 'active' | 'inactive' | 'maintenance' | 'error'
export type GeofenceEventType = 'entry' | 'exit' | 'dwell'
export type GeofenceStatus = 'active' | 'inactive' | 'draft'
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'assign' | 'transfer'
export type UserRole = 'owner' | 'admin' | 'manager' | 'user' | 'viewer'
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'

// =====================================================
// CORE INTERFACES
// =====================================================

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: TenantInsert
        Update: TenantUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      asset_categories: {
        Row: AssetCategory
        Insert: AssetCategoryInsert
        Update: AssetCategoryUpdate
      }
      assets: {
        Row: Asset
        Insert: AssetInsert
        Update: AssetUpdate
      }
      asset_maintenance: {
        Row: AssetMaintenance
        Insert: AssetMaintenanceInsert
        Update: AssetMaintenanceUpdate
      }
      asset_history: {
        Row: AssetHistory
        Insert: AssetHistoryInsert
        Update: AssetHistoryUpdate
      }
      iot_devices: {
        Row: IoTDevice
        Insert: IoTDeviceInsert
        Update: IoTDeviceUpdate
      }
      sensor_data: {
        Row: SensorData
        Insert: SensorDataInsert
        Update: SensorDataUpdate
      }
      geofences: {
        Row: Geofence
        Insert: GeofenceInsert
        Update: GeofenceUpdate
      }
      geofence_events: {
        Row: GeofenceEvent
        Insert: GeofenceEventInsert
        Update: GeofenceEventUpdate
      }
      audit_logs: {
        Row: AuditLog
        Insert: AuditLogInsert
        Update: AuditLogUpdate
      }
      data_retention_policies: {
        Row: DataRetentionPolicy
        Insert: DataRetentionPolicyInsert
        Update: DataRetentionPolicyUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_tenant_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: { required_role: string }
        Returns: boolean
      }
      has_any_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      can_access_asset: {
        Args: { asset_id: string }
        Returns: boolean
      }
      set_current_user_context: {
        Args: { user_id: string; tenant_id: string }
        Returns: void
      }
      clear_user_context: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      check_tenant_access: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      tenant_status: TenantStatus
      subscription_plan: SubscriptionPlan
      asset_status: AssetStatus
      depreciation_method: DepreciationMethod
      iot_device_type: IoTDeviceType
      iot_protocol: IoTProtocol
      device_status: DeviceStatus
      geofence_event_type: GeofenceEventType
      geofence_status: GeofenceStatus
      audit_action: AuditAction
    }
  }
}

// =====================================================
// AUTHENTICATION TYPES
// =====================================================

export interface MfaMethod {
  id: string
  tenant_id: string
  user_id: string
  method_type: 'totp' | 'sms' | 'email' | 'backup_codes'
  method_name: string
  secret_encrypted?: string
  backup_codes?: string[]
  is_verified: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface MfaMethodInsert {
  tenant_id: string
  user_id: string
  method_type: 'totp' | 'sms' | 'email' | 'backup_codes'
  method_name: string
  secret_encrypted?: string
  backup_codes?: string[]
  is_verified?: boolean
  is_primary?: boolean
}

export interface MfaMethodUpdate {
  method_name?: string
  secret_encrypted?: string
  backup_codes?: string[]
  is_verified?: boolean
  is_primary?: boolean
  last_used_at?: string
}

export interface MfaVerificationAttempt {
  id: string
  tenant_id: string
  user_id: string
  mfa_method_id: string
  attempt_type: 'login' | 'setup' | 'recovery'
  code_hash?: string
  ip_address?: string
  user_agent?: string
  is_successful: boolean
  failure_reason?: string
  created_at: string
  expires_at: string
}

export interface SsoProvider {
  id: string
  tenant_id: string
  provider_name: string
  provider_type: 'saml2' | 'oauth2' | 'oidc'
  is_enabled: boolean
  configuration: Record<string, any>
  entity_id?: string
  sso_url?: string
  slo_url?: string
  certificate?: string
  client_id?: string
  client_secret_encrypted?: string
  authorization_url?: string
  token_url?: string
  userinfo_url?: string
  jwks_url?: string
  attribute_mapping: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SsoProviderInsert {
  tenant_id: string
  provider_name: string
  provider_type: 'saml2' | 'oauth2' | 'oidc'
  is_enabled?: boolean
  configuration?: Record<string, any>
  entity_id?: string
  sso_url?: string
  slo_url?: string
  certificate?: string
  client_id?: string
  client_secret_encrypted?: string
  authorization_url?: string
  token_url?: string
  userinfo_url?: string
  jwks_url?: string
  attribute_mapping?: Record<string, any>
}

export interface SsoProviderUpdate {
  provider_name?: string
  provider_type?: 'saml2' | 'oauth2' | 'oidc'
  is_enabled?: boolean
  configuration?: Record<string, any>
  entity_id?: string
  sso_url?: string
  slo_url?: string
  certificate?: string
  client_id?: string
  client_secret_encrypted?: string
  authorization_url?: string
  token_url?: string
  userinfo_url?: string
  jwks_url?: string
  attribute_mapping?: Record<string, any>
}

export interface SsoSession {
  id: string
  tenant_id: string
  user_id: string
  provider_id: string
  saml_session_id?: string
  oauth_state?: string
  attributes: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  expires_at: string
  terminated_at?: string
}

export interface UserSession {
  id: string
  tenant_id: string
  user_id: string
  session_token_hash: string
  refresh_token_hash?: string
  device_fingerprint?: string
  device_name?: string
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'api'
  browser_name?: string
  browser_version?: string
  os_name?: string
  os_version?: string
  ip_address: string
  country_code?: string
  city?: string
  user_agent?: string
  is_active: boolean
  last_activity_at: string
  created_at: string
  expires_at: string
  terminated_at?: string
  termination_reason?: 'logout' | 'timeout' | 'admin_revoke' | 'security_revoke' | 'concurrent_limit'
}

export interface UserSessionInsert {
  tenant_id: string
  user_id: string
  session_token_hash: string
  refresh_token_hash?: string
  device_fingerprint?: string
  device_name?: string
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'api'
  browser_name?: string
  browser_version?: string
  os_name?: string
  os_version?: string
  ip_address: string
  country_code?: string
  city?: string
  user_agent?: string
  expires_at: string
}

export interface SessionActivity {
  id: string
  tenant_id: string
  session_id: string
  activity_type: 'login' | 'logout' | 'api_call' | 'page_view' | 'action' | 'security_event'
  activity_details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface ApiKey {
  id: string
  tenant_id: string
  user_id: string
  key_name: string
  key_prefix: string
  key_hash: string
  permissions: Record<string, any>
  scopes: string[]
  allowed_ips: string[]
  rate_limit_requests: number
  rate_limit_window_seconds: number
  is_active: boolean
  last_used_at?: string
  created_at: string
  expires_at?: string
  revoked_at?: string
  revoked_reason?: string
}

export interface ApiKeyInsert {
  tenant_id: string
  user_id: string
  key_name: string
  key_prefix: string
  key_hash: string
  permissions?: Record<string, any>
  scopes?: string[]
  allowed_ips?: string[]
  rate_limit_requests?: number
  rate_limit_window_seconds?: number
  expires_at?: string
}

export interface ApiKeyUpdate {
  key_name?: string
  permissions?: Record<string, any>
  scopes?: string[]
  allowed_ips?: string[]
  rate_limit_requests?: number
  rate_limit_window_seconds?: number
  is_active?: boolean
  expires_at?: string
  revoked_at?: string
  revoked_reason?: string
}

export interface ApiKeyUsage {
  id: string
  tenant_id: string
  api_key_id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms?: number
  ip_address?: string
  user_agent?: string
  request_size_bytes?: number
  response_size_bytes?: number
  created_at: string
}

export interface SecurityEvent {
  id: string
  tenant_id: string
  user_id?: string
  session_id?: string
  event_type: 'login_success' | 'login_failure' | 'mfa_success' | 'mfa_failure' | 
             'password_change' | 'account_locked' | 'account_unlocked' |
             'suspicious_activity' | 'api_key_created' | 'api_key_revoked' |
             'session_terminated' | 'concurrent_session_limit'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  location_country?: string
  location_city?: string
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
  created_at: string
}

export interface SecurityEventInsert {
  tenant_id: string
  user_id?: string
  session_id?: string
  event_type: SecurityEvent['event_type']
  severity: SecurityEvent['severity']
  description: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  location_country?: string
  location_city?: string
}

// =====================================================
// TENANT TYPES
// =====================================================

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  plan: SubscriptionPlan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_email?: string
  trial_ends_at?: string
  subscription_ends_at?: string
  settings: Json
  branding: Json
  feature_flags: Json
  data_residency: string
  compliance_requirements: string[]
  asset_limit: number
  user_limit: number
  storage_limit_gb: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TenantInsert {
  id?: string
  name: string
  slug: string
  status?: TenantStatus
  plan?: SubscriptionPlan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_email?: string
  trial_ends_at?: string
  subscription_ends_at?: string
  settings?: Json
  branding?: Json
  feature_flags?: Json
  data_residency?: string
  compliance_requirements?: string[]
  asset_limit?: number
  user_limit?: number
  storage_limit_gb?: number
  created_by?: string
}

export interface TenantUpdate {
  name?: string
  slug?: string
  status?: TenantStatus
  plan?: SubscriptionPlan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_email?: string
  trial_ends_at?: string
  subscription_ends_at?: string
  settings?: Json
  branding?: Json
  feature_flags?: Json
  data_residency?: string
  compliance_requirements?: string[]
  asset_limit?: number
  user_limit?: number
  storage_limit_gb?: number
}

// =====================================================
// PROFILE TYPES
// =====================================================

export interface Profile {
  id: string
  tenant_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  permissions: Json
  department?: string
  job_title?: string
  mfa_enabled: boolean
  mfa_secret?: string
  backup_codes?: string[]
  last_login_at?: string
  last_login_ip?: string
  failed_login_attempts: number
  locked_until?: string
  preferences: Json
  timezone: string
  language: string
  is_owner: boolean
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  tenant_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: UserRole
  permissions?: Json
  department?: string
  job_title?: string
  mfa_enabled?: boolean
  mfa_secret?: string
  backup_codes?: string[]
  preferences?: Json
  timezone?: string
  language?: string
  is_owner?: boolean
}

export interface ProfileUpdate {
  tenant_id?: string
  email?: string
  full_name?: string
  avatar_url?: string
  role?: UserRole
  permissions?: Json
  department?: string
  job_title?: string
  mfa_enabled?: boolean
  mfa_secret?: string
  backup_codes?: string[]
  last_login_at?: string
  last_login_ip?: string
  failed_login_attempts?: number
  locked_until?: string
  preferences?: Json
  timezone?: string
  language?: string
  is_owner?: boolean
}

// =====================================================
// ASSET CATEGORY TYPES
// =====================================================

export interface AssetCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  custom_fields: Json
  created_at: string
  updated_at: string
}

export interface AssetCategoryInsert {
  id?: string
  tenant_id: string
  name: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  custom_fields?: Json
}

export interface AssetCategoryUpdate {
  name?: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  custom_fields?: Json
}

// =====================================================
// ASSET TYPES
// =====================================================

export interface Asset {
  id: string
  tenant_id: string
  asset_id: string
  name: string
  description?: string
  category_id?: string
  parent_asset_id?: string
  tags: string[]
  status: AssetStatus
  condition_rating?: number
  location?: Json
  current_location?: string // PostGIS geometry as string
  assignee_id?: string
  department?: string
  purchase_price?: number
  current_value?: number
  depreciation_method: DepreciationMethod
  depreciation_rate?: number
  residual_value?: number
  purchase_date?: string
  warranty_start_date?: string
  warranty_expiry_date?: string
  last_maintenance_date?: string
  next_maintenance_date?: string
  retirement_date?: string
  disposal_date?: string
  vendor_name?: string
  vendor_contact?: Json
  purchase_order_number?: string
  invoice_number?: string
  model?: string
  serial_number?: string
  manufacturer?: string
  specifications: Json
  custom_fields: Json
  qr_code?: string
  barcode?: string
  rfid_tag?: string
  nfc_tag?: string
  attachments: Json
  certifications: Json
  compliance_notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface AssetInsert {
  id?: string
  tenant_id: string
  asset_id: string
  name: string
  description?: string
  category_id?: string
  parent_asset_id?: string
  tags?: string[]
  status?: AssetStatus
  condition_rating?: number
  location?: Json
  current_location?: string
  assignee_id?: string
  department?: string
  purchase_price?: number
  current_value?: number
  depreciation_method?: DepreciationMethod
  depreciation_rate?: number
  residual_value?: number
  purchase_date?: string
  warranty_start_date?: string
  warranty_expiry_date?: string
  last_maintenance_date?: string
  next_maintenance_date?: string
  retirement_date?: string
  disposal_date?: string
  vendor_name?: string
  vendor_contact?: Json
  purchase_order_number?: string
  invoice_number?: string
  model?: string
  serial_number?: string
  manufacturer?: string
  specifications?: Json
  custom_fields?: Json
  qr_code?: string
  barcode?: string
  rfid_tag?: string
  nfc_tag?: string
  attachments?: Json
  certifications?: Json
  compliance_notes?: string
  created_by: string
}

export interface AssetUpdate {
  asset_id?: string
  name?: string
  description?: string
  category_id?: string
  parent_asset_id?: string
  tags?: string[]
  status?: AssetStatus
  condition_rating?: number
  location?: Json
  current_location?: string
  assignee_id?: string
  department?: string
  purchase_price?: number
  current_value?: number
  depreciation_method?: DepreciationMethod
  depreciation_rate?: number
  residual_value?: number
  purchase_date?: string
  warranty_start_date?: string
  warranty_expiry_date?: string
  last_maintenance_date?: string
  next_maintenance_date?: string
  retirement_date?: string
  disposal_date?: string
  vendor_name?: string
  vendor_contact?: Json
  purchase_order_number?: string
  invoice_number?: string
  model?: string
  serial_number?: string
  manufacturer?: string
  specifications?: Json
  custom_fields?: Json
  qr_code?: string
  barcode?: string
  rfid_tag?: string
  nfc_tag?: string
  attachments?: Json
  certifications?: Json
  compliance_notes?: string
}

// =====================================================
// ASSET MAINTENANCE TYPES
// =====================================================

export interface AssetMaintenance {
  id: string
  tenant_id: string
  asset_id: string
  maintenance_type: MaintenanceType
  title: string
  description?: string
  priority: MaintenancePriority
  scheduled_date?: string
  completed_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  assigned_to?: string
  technician_notes?: string
  cost?: number
  parts_used: Json
  status: MaintenanceStatus
  attachments: Json
  created_by: string
  created_at: string
  updated_at: string
}

export interface AssetMaintenanceInsert {
  id?: string
  tenant_id: string
  asset_id: string
  maintenance_type: MaintenanceType
  title: string
  description?: string
  priority?: MaintenancePriority
  scheduled_date?: string
  completed_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  assigned_to?: string
  technician_notes?: string
  cost?: number
  parts_used?: Json
  status?: MaintenanceStatus
  attachments?: Json
  created_by: string
}

export interface AssetMaintenanceUpdate {
  maintenance_type?: MaintenanceType
  title?: string
  description?: string
  priority?: MaintenancePriority
  scheduled_date?: string
  completed_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  assigned_to?: string
  technician_notes?: string
  cost?: number
  parts_used?: Json
  status?: MaintenanceStatus
  attachments?: Json
}

// =====================================================
// ASSET HISTORY TYPES
// =====================================================

export interface AssetHistory {
  id: string
  tenant_id: string
  asset_id: string
  action: AuditAction
  field_name?: string
  old_value?: Json
  new_value?: Json
  change_summary?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  performed_by?: string
  performed_at: string
}

export interface AssetHistoryInsert {
  id?: string
  tenant_id: string
  asset_id: string
  action: AuditAction
  field_name?: string
  old_value?: Json
  new_value?: Json
  change_summary?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  performed_by?: string
}

export interface AssetHistoryUpdate {
  action?: AuditAction
  field_name?: string
  old_value?: Json
  new_value?: Json
  change_summary?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
}

// =====================================================
// IOT DEVICE TYPES
// =====================================================

export interface IoTDevice {
  id: string
  tenant_id: string
  asset_id: string
  device_id: string
  device_name?: string
  device_type: IoTDeviceType
  manufacturer?: string
  model?: string
  firmware_version?: string
  protocol: IoTProtocol
  endpoint_url?: string
  api_key?: string
  configuration: Json
  sampling_interval: number
  status: DeviceStatus
  last_seen?: string
  battery_level?: number
  signal_strength?: number
  location?: string // PostGIS geometry as string
  created_at: string
  updated_at: string
}

export interface IoTDeviceInsert {
  id?: string
  tenant_id: string
  asset_id: string
  device_id: string
  device_name?: string
  device_type: IoTDeviceType
  manufacturer?: string
  model?: string
  firmware_version?: string
  protocol: IoTProtocol
  endpoint_url?: string
  api_key?: string
  configuration?: Json
  sampling_interval?: number
  status?: DeviceStatus
  last_seen?: string
  battery_level?: number
  signal_strength?: number
  location?: string
}

export interface IoTDeviceUpdate {
  device_id?: string
  device_name?: string
  device_type?: IoTDeviceType
  manufacturer?: string
  model?: string
  firmware_version?: string
  protocol?: IoTProtocol
  endpoint_url?: string
  api_key?: string
  configuration?: Json
  sampling_interval?: number
  status?: DeviceStatus
  last_seen?: string
  battery_level?: number
  signal_strength?: number
  location?: string
}

// =====================================================
// SENSOR DATA TYPES
// =====================================================

export interface SensorData {
  id: string
  tenant_id: string
  device_id: string
  sensor_type: string
  value?: number
  unit?: string
  quality_score: number
  location?: string // PostGIS geometry as string
  timestamp: string
  metadata: Json
}

export interface SensorDataInsert {
  id?: string
  tenant_id: string
  device_id: string
  sensor_type: string
  value?: number
  unit?: string
  quality_score?: number
  location?: string
  timestamp?: string
  metadata?: Json
}

export interface SensorDataUpdate {
  sensor_type?: string
  value?: number
  unit?: string
  quality_score?: number
  location?: string
  metadata?: Json
}

// =====================================================
// GEOFENCE TYPES
// =====================================================

export interface Geofence {
  id: string
  tenant_id: string
  name: string
  description?: string
  geometry: string // PostGIS geometry as string
  rules: Json
  alert_on_entry: boolean
  alert_on_exit: boolean
  alert_on_dwell: boolean
  dwell_threshold_minutes: number
  status: GeofenceStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface GeofenceInsert {
  id?: string
  tenant_id: string
  name: string
  description?: string
  geometry: string
  rules?: Json
  alert_on_entry?: boolean
  alert_on_exit?: boolean
  alert_on_dwell?: boolean
  dwell_threshold_minutes?: number
  status?: GeofenceStatus
  created_by: string
}

export interface GeofenceUpdate {
  name?: string
  description?: string
  geometry?: string
  rules?: Json
  alert_on_entry?: boolean
  alert_on_exit?: boolean
  alert_on_dwell?: boolean
  dwell_threshold_minutes?: number
  status?: GeofenceStatus
}

// =====================================================
// GEOFENCE EVENT TYPES
// =====================================================

export interface GeofenceEvent {
  id: string
  tenant_id: string
  asset_id: string
  geofence_id: string
  event_type: GeofenceEventType
  location?: string // PostGIS geometry as string
  timestamp: string
  metadata: Json
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

export interface GeofenceEventInsert {
  id?: string
  tenant_id: string
  asset_id: string
  geofence_id: string
  event_type: GeofenceEventType
  location?: string
  timestamp?: string
  metadata?: Json
  acknowledged?: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

export interface GeofenceEventUpdate {
  event_type?: GeofenceEventType
  location?: string
  metadata?: Json
  acknowledged?: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export interface AuditLog {
  id: string
  tenant_id: string
  action: AuditAction
  resource_type: string
  resource_id?: string
  before_state?: Json
  after_state?: Json
  changes?: Json
  user_id?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  request_id?: string
  compliance_category?: string
  retention_period_days: number
  timestamp: string
  metadata: Json
}

export interface AuditLogInsert {
  id?: string
  tenant_id: string
  action: AuditAction
  resource_type: string
  resource_id?: string
  before_state?: Json
  after_state?: Json
  changes?: Json
  user_id?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  request_id?: string
  compliance_category?: string
  retention_period_days?: number
  timestamp?: string
  metadata?: Json
}

export interface AuditLogUpdate {
  action?: AuditAction
  resource_type?: string
  resource_id?: string
  before_state?: Json
  after_state?: Json
  changes?: Json
  user_id?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  request_id?: string
  compliance_category?: string
  retention_period_days?: number
  metadata?: Json
}

// =====================================================
// DATA RETENTION POLICY TYPES
// =====================================================

export interface DataRetentionPolicy {
  id: string
  tenant_id: string
  name: string
  description?: string
  table_name: string
  retention_period_days: number
  conditions: Json
  enabled: boolean
  last_run_at?: string
  next_run_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface DataRetentionPolicyInsert {
  id?: string
  tenant_id: string
  name: string
  description?: string
  table_name: string
  retention_period_days: number
  conditions?: Json
  enabled?: boolean
  last_run_at?: string
  next_run_at?: string
  created_by: string
}

export interface DataRetentionPolicyUpdate {
  name?: string
  description?: string
  table_name?: string
  retention_period_days?: number
  conditions?: Json
  enabled?: boolean
  last_run_at?: string
  next_run_at?: string
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface TenantContext {
  tenantId: string
  userId: string
  role: UserRole
  permissions: Json
}

export interface AssetWithRelations extends Asset {
  category?: AssetCategory
  assignee?: Profile
  parent_asset?: Asset
  child_assets?: Asset[]
  maintenance_records?: AssetMaintenance[]
  iot_devices?: IoTDevice[]
  history?: AssetHistory[]
}

export interface GeofenceWithEvents extends Geofence {
  events?: GeofenceEvent[]
  recent_events_count?: number
}

export interface IoTDeviceWithData extends IoTDevice {
  latest_sensor_data?: SensorData[]
  asset?: Asset
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AssetStats {
  total: number
  byStatus: Record<AssetStatus, number>
  byCategory: Record<string, number>
  totalValue: number
  recentAdditions: number
}

export interface TenantUsage {
  assets: {
    current: number
    limit: number
    percentage: number
  }
  users: {
    current: number
    limit: number
    percentage: number
  }
  storage: {
    current: number
    limit: number
    percentage: number
  }
}