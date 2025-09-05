// =====================================================
// RBAC SYSTEM TYPES
// =====================================================
// TypeScript types for the hierarchical RBAC system

export type PermissionScope = 'global' | 'tenant' | 'department' | 'personal'
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'transfer'
  | 'approve'
  | 'export'
  | 'import'
  | 'manage'
export type ResourceType =
  | 'asset'
  | 'user'
  | 'role'
  | 'department'
  | 'report'
  | 'setting'
  | 'audit'
  | 'maintenance'
  | 'geofence'
  | 'iot_device'
export type DelegationStatus = 'active' | 'expired' | 'revoked' | 'pending'
export type DepartmentType =
  | 'operational'
  | 'administrative'
  | 'technical'
  | 'financial'
  | 'security'

// =====================================================
// CORE RBAC INTERFACES
// =====================================================

export interface Role {
  id: string
  tenant_id: string
  name: string
  display_name: string
  description?: string
  parent_role_id?: string
  level: number
  hierarchy_path: string
  is_system_role: boolean
  is_default_role: boolean
  max_users?: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface RoleInsert {
  tenant_id: string
  name: string
  display_name: string
  description?: string
  parent_role_id?: string
  is_system_role?: boolean
  is_default_role?: boolean
  max_users?: number
  created_by: string
}

export interface RoleUpdate {
  name?: string
  display_name?: string
  description?: string
  parent_role_id?: string
  is_default_role?: boolean
  max_users?: number
  is_active?: boolean
}

export interface Permission {
  id: string
  name: string
  display_name: string
  description?: string
  resource_type: ResourceType
  action: PermissionAction
  scope: PermissionScope
  is_system_permission: boolean
  created_at: string
  updated_at: string
}

export interface PermissionInsert {
  name: string
  display_name: string
  description?: string
  resource_type: ResourceType
  action: PermissionAction
  scope?: PermissionScope
  is_system_permission?: boolean
}

export interface RolePermission {
  id: string
  tenant_id: string
  role_id: string
  permission_id: string
  conditions: Record<string, any>
  resource_filters: Record<string, any>
  inherited_from_role_id?: string
  created_at: string
}

export interface RolePermissionInsert {
  tenant_id: string
  role_id: string
  permission_id: string
  conditions?: Record<string, any>
  resource_filters?: Record<string, any>
  inherited_from_role_id?: string
}

export interface UserRole {
  id: string
  tenant_id: string
  user_id: string
  role_id: string
  assigned_by: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
}

export interface UserRoleInsert {
  tenant_id: string
  user_id: string
  role_id: string
  assigned_by: string
  expires_at?: string
}

export interface UserRoleUpdate {
  expires_at?: string
  is_active?: boolean
}

// =====================================================
// DEPARTMENT INTERFACES
// =====================================================

export interface Department {
  id: string
  tenant_id: string
  name: string
  display_name: string
  description?: string
  code?: string
  parent_department_id?: string
  level: number
  hierarchy_path: string
  department_type: DepartmentType
  manager_id?: string
  budget_limit?: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface DepartmentInsert {
  tenant_id: string
  name: string
  display_name: string
  description?: string
  code?: string
  parent_department_id?: string
  department_type?: DepartmentType
  manager_id?: string
  budget_limit?: number
  created_by: string
}

export interface DepartmentUpdate {
  name?: string
  display_name?: string
  description?: string
  code?: string
  parent_department_id?: string
  department_type?: DepartmentType
  manager_id?: string
  budget_limit?: number
  is_active?: boolean
}

export interface UserDepartment {
  id: string
  tenant_id: string
  user_id: string
  department_id: string
  is_primary: boolean
  role_in_department?: string
  assigned_by: string
  assigned_at: string
}

export interface UserDepartmentInsert {
  tenant_id: string
  user_id: string
  department_id: string
  is_primary?: boolean
  role_in_department?: string
  assigned_by: string
}

export interface DepartmentRole {
  id: string
  tenant_id: string
  department_id: string
  role_id: string
  is_default_role: boolean
  max_users?: number
  created_by: string
  created_at: string
}

export interface DepartmentRoleInsert {
  tenant_id: string
  department_id: string
  role_id: string
  is_default_role?: boolean
  max_users?: number
  created_by: string
}

// =====================================================
// DELEGATION INTERFACES
// =====================================================

export interface PermissionDelegation {
  id: string
  tenant_id: string
  delegator_id: string
  delegatee_id: string
  role_id?: string
  permission_ids: string[]
  scope: PermissionScope
  resource_filters: Record<string, any>
  conditions: Record<string, any>
  starts_at: string
  expires_at: string
  status: DelegationStatus
  reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PermissionDelegationWithProfiles extends PermissionDelegation {
  delegator?: {
    id: string
    full_name?: string
    email: string
  }
  delegatee?: {
    id: string
    full_name?: string
    email: string
  }
  role?: {
    id: string
    display_name: string
  }
}

export interface PermissionDelegationInsert {
  tenant_id: string
  delegator_id: string
  delegatee_id: string
  role_id?: string
  permission_ids: string[]
  scope?: PermissionScope
  resource_filters?: Record<string, any>
  conditions?: Record<string, any>
  starts_at?: string
  expires_at: string
  reason?: string
  notes?: string
}

export interface PermissionDelegationUpdate {
  expires_at?: string
  status?: DelegationStatus
  notes?: string
}

export interface GuestAccess {
  id: string
  tenant_id: string
  email: string
  full_name?: string
  invited_by: string
  role_id?: string
  permissions: Record<string, any>
  resource_access: Record<string, any>
  expires_at: string
  max_sessions: number
  is_active: boolean
  first_login_at?: string
  last_login_at?: string
  login_count: number
  created_at: string
  updated_at: string
}

export interface GuestAccessWithRole extends GuestAccess {
  role?: {
    id: string
    display_name: string
  }
}

export interface GuestAccessInsert {
  tenant_id: string
  email: string
  full_name?: string
  invited_by: string
  role_id?: string
  permissions?: Record<string, any>
  resource_access?: Record<string, any>
  expires_at: string
  max_sessions?: number
}

export interface GuestAccessUpdate {
  permissions?: Record<string, any>
  resource_access?: Record<string, any>
  expires_at?: string
  max_sessions?: number
  is_active?: boolean
}

// =====================================================
// AUDIT INTERFACES
// =====================================================

export interface PermissionUsage {
  id: string
  tenant_id: string
  user_id: string
  permission_id: string
  resource_type: ResourceType
  resource_id?: string
  endpoint?: string
  method?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  was_granted: boolean
  denial_reason?: string
  timestamp: string
  response_time_ms?: number
}

export interface PermissionUsageInsert {
  tenant_id: string
  user_id: string
  permission_id: string
  resource_type: ResourceType
  resource_id?: string
  endpoint?: string
  method?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  was_granted: boolean
  denial_reason?: string
  response_time_ms?: number
}

export interface RoleAssignmentHistory {
  id: string
  tenant_id: string
  user_id: string
  role_id: string
  action: string
  performed_by?: string
  reason?: string
  effective_at: string
  expires_at?: string
  created_at: string
}

export interface RoleAssignmentHistoryInsert {
  tenant_id: string
  user_id: string
  role_id: string
  action: string
  performed_by?: string
  reason?: string
  effective_at?: string
  expires_at?: string
}

// =====================================================
// EXTENDED INTERFACES WITH RELATIONS
// =====================================================

export interface RoleWithPermissions extends Role {
  permissions: (Permission & {
    conditions?: Record<string, any>
    resource_filters?: Record<string, any>
    inherited_from_role_id?: string
  })[]
  parent_role?: Role
  child_roles?: Role[]
  user_count?: number
}

export interface UserWithRoles {
  id: string
  email: string
  full_name?: string
  roles: (Role & {
    assigned_at: string
    expires_at?: string
    assigned_by: string
  })[]
  departments: (Department & {
    is_primary: boolean
    role_in_department?: string
  })[]
  effective_permissions: UserPermission[]
}

export interface UserPermission {
  permission_name: string
  resource_type: ResourceType
  action: PermissionAction
  scope: PermissionScope
  conditions: Record<string, any>
  resource_filters: Record<string, any>
  source: 'direct' | 'inherited' | 'delegated'
}

export interface DepartmentWithHierarchy extends Department {
  parent_department?: Department
  child_departments?: Department[]
  manager?: {
    id: string
    full_name?: string
    email: string
  }
  user_count?: number
  roles?: Role[]
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateRoleRequest {
  name: string
  display_name: string
  description?: string
  parent_role_id?: string
  permission_names?: string[]
  is_default_role?: boolean
  max_users?: number
}

export interface UpdateRoleRequest {
  display_name?: string
  description?: string
  parent_role_id?: string
  is_default_role?: boolean
  max_users?: number
  is_active?: boolean
}

export interface AssignRoleRequest {
  user_id: string
  role_id: string
  expires_at?: string
}

export interface RevokeRoleRequest {
  user_id: string
  role_id: string
  reason?: string
}

export interface CreateDelegationRequest {
  delegatee_id: string
  role_id?: string
  permission_names?: string[]
  scope?: PermissionScope
  resource_filters?: Record<string, any>
  conditions?: Record<string, any>
  expires_at: string
  reason?: string
  notes?: string
}

export interface CreateGuestAccessRequest {
  email: string
  full_name?: string
  role_id?: string
  permissions?: Record<string, any>
  resource_access?: Record<string, any>
  expires_at: string
  max_sessions?: number
}

export interface PermissionCheckRequest {
  permission_name: string
  resource_id?: string
  context?: Record<string, any>
}

export interface PermissionCheckResponse {
  granted: boolean
  reason?: string
  source?: 'direct' | 'inherited' | 'delegated'
  conditions?: Record<string, any>
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface RoleHierarchyNode {
  role: Role
  children: RoleHierarchyNode[]
  permissions: Permission[]
  user_count: number
}

export interface DepartmentHierarchyNode {
  department: Department
  children: DepartmentHierarchyNode[]
  users: UserWithRoles[]
  roles: Role[]
}

export interface PermissionMatrix {
  [userId: string]: {
    [permissionName: string]: {
      granted: boolean
      source: 'direct' | 'inherited' | 'delegated'
      conditions?: Record<string, any>
    }
  }
}

export interface RoleAnalytics {
  role_id: string
  role_name: string
  user_count: number
  permission_count: number
  usage_stats: {
    total_checks: number
    granted_checks: number
    denied_checks: number
    avg_response_time_ms: number
  }
  most_used_permissions: {
    permission_name: string
    usage_count: number
  }[]
}

export interface DepartmentAnalytics {
  department_id: string
  department_name: string
  user_count: number
  role_distribution: {
    role_name: string
    user_count: number
  }[]
  permission_usage: {
    permission_name: string
    usage_count: number
  }[]
}

// =====================================================
// VALIDATION SCHEMAS (for use with zod or similar)
// =====================================================

export interface RoleValidationRules {
  name: {
    required: true
    minLength: 2
    maxLength: 50
    pattern: string
  }
  display_name: {
    required: true
    minLength: 2
    maxLength: 100
  }
  description: {
    maxLength: 500
  }
  max_users: {
    min: 1
    max: 10000
  }
}

export interface DepartmentValidationRules {
  name: {
    required: true
    minLength: 2
    maxLength: 100
  }
  code: {
    pattern: string
    maxLength: 20
  }
  budget_limit: {
    min: 0
    max: 999999999.99
  }
}

export interface DelegationValidationRules {
  expires_at: {
    required: true
    futureDate: true
    maxDuration: string
  }
  permission_ids: {
    required: true
    minItems: 1
    maxItems: 50
  }
}

// =====================================================
// VALIDATION CONSTANTS
// =====================================================

export const VALIDATION_PATTERNS = {
  ROLE_NAME: /^[a-zA-Z0-9_-]+$/,
  DEPARTMENT_CODE: /^[A-Z0-9_-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

export const VALIDATION_LIMITS = {
  MAX_DELEGATION_DURATION_DAYS: 365,
  MAX_GUEST_ACCESS_DURATION_DAYS: 90,
  MAX_ROLE_HIERARCHY_DEPTH: 10,
  MAX_PERMISSIONS_PER_ROLE: 100,
  MAX_ROLES_PER_USER: 10,
} as const

// =====================================================
// ERROR TYPES
// =====================================================

export interface RBACError {
  code: string
  message: string
  details?: Record<string, any>
}

export type RBACErrorCode =
  | 'ROLE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CIRCULAR_HIERARCHY'
  | 'MAX_USERS_EXCEEDED'
  | 'DELEGATION_EXPIRED'
  | 'INVALID_SCOPE'
  | 'SYSTEM_ROLE_IMMUTABLE'
  | 'DEPARTMENT_NOT_FOUND'
  | 'USER_NOT_IN_DEPARTMENT'
  | 'GUEST_ACCESS_EXPIRED'
  | 'INVALID_DELEGATION'

// =====================================================
// CONFIGURATION TYPES
// =====================================================

export interface RBACConfig {
  max_role_hierarchy_depth: number
  max_permissions_per_role: number
  max_roles_per_user: number
  max_delegation_duration_days: number
  max_guest_access_duration_days: number
  permission_cache_ttl_seconds: number
  audit_retention_days: number
  cleanup_interval_hours: number
}

export interface TenantRBACSettings {
  tenant_id: string
  allow_role_hierarchy: boolean
  allow_permission_delegation: boolean
  allow_guest_access: boolean
  max_custom_roles: number
  max_departments: number
  require_approval_for_role_changes: boolean
  audit_all_permission_checks: boolean
  config: RBACConfig
}
