-- =====================================================
-- HIERARCHICAL ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- =====================================================
-- This script creates the enhanced RBAC system with hierarchical roles,
-- permission inheritance, department-based access controls, and delegation capabilities.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- RBAC CUSTOM TYPES AND ENUMS
-- =====================================================

-- Permission scope enum
CREATE TYPE permission_scope AS ENUM ('global', 'tenant', 'department', 'personal');

-- Permission action enum
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'assign', 'transfer', 'approve', 'export', 'import', 'manage');

-- Resource type enum
CREATE TYPE resource_type AS ENUM ('asset', 'user', 'role', 'department', 'report', 'setting', 'audit', 'maintenance', 'geofence', 'iot_device');

-- Delegation status enum
CREATE TYPE delegation_status AS ENUM ('active', 'expired', 'revoked', 'pending');

-- Department type enum
CREATE TYPE department_type AS ENUM ('operational', 'administrative', 'technical', 'financial', 'security');

-- =====================================================
-- HIERARCHICAL ROLE SYSTEM TABLES
-- =====================================================

-- Role definitions with hierarchy support
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Role identification
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy support
  parent_role_id UUID REFERENCES public.roles(id),
  level INTEGER DEFAULT 0, -- 0 = root level
  hierarchy_path TEXT, -- Materialized path for efficient queries
  
  -- Role configuration
  is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted
  is_default_role BOOLEAN DEFAULT FALSE, -- Assigned to new users
  max_users INTEGER, -- Limit number of users with this role
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name),
  CHECK (parent_role_id != id) -- Prevent self-reference
);

-- Permission definitions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Permission identification
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Permission categorization
  resource_type resource_type NOT NULL,
  action permission_action NOT NULL,
  scope permission_scope DEFAULT 'tenant',
  
  -- Permission metadata
  is_system_permission BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mapping with inheritance
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  
  -- Permission constraints
  conditions JSONB DEFAULT '{}', -- Additional conditions for permission
  resource_filters JSONB DEFAULT '{}', -- Resource-specific filters
  
  -- Inheritance tracking
  inherited_from_role_id UUID REFERENCES public.roles(id), -- NULL if directly assigned
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, role_id, permission_id)
);

-- User-Role assignments
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  
  -- Assignment metadata
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for permanent assignments
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(tenant_id, user_id, role_id)
);

-- =====================================================
-- DEPARTMENT AND ORGANIZATIONAL STRUCTURE
-- =====================================================

-- Department hierarchy
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Department identification
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  code TEXT, -- Department code for integrations
  
  -- Hierarchy support
  parent_department_id UUID REFERENCES public.departments(id),
  level INTEGER DEFAULT 0,
  hierarchy_path TEXT,
  
  -- Department configuration
  department_type department_type DEFAULT 'operational',
  manager_id UUID REFERENCES public.profiles(id),
  budget_limit DECIMAL(15,2),
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name),
  UNIQUE(tenant_id, code),
  CHECK (parent_department_id != id)
);

-- User-Department assignments
CREATE TABLE IF NOT EXISTS public.user_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  
  -- Assignment details
  is_primary BOOLEAN DEFAULT FALSE, -- Primary department for the user
  role_in_department TEXT, -- Role within this department
  
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id, department_id)
);

-- Department-specific role assignments
CREATE TABLE IF NOT EXISTS public.department_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  
  -- Department role configuration
  is_default_role BOOLEAN DEFAULT FALSE, -- Assigned to new department members
  max_users INTEGER, -- Limit within this department
  
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, department_id, role_id)
);

-- =====================================================
-- DELEGATION SYSTEM
-- =====================================================

-- Permission delegations
CREATE TABLE IF NOT EXISTS public.permission_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Delegation parties
  delegator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  delegatee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Delegated permissions
  role_id UUID REFERENCES public.roles(id), -- Delegate entire role
  permission_ids UUID[], -- Or specific permissions
  
  -- Delegation scope and constraints
  scope permission_scope DEFAULT 'personal',
  resource_filters JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  
  -- Time constraints
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status and metadata
  status delegation_status DEFAULT 'active',
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (delegator_id != delegatee_id),
  CHECK (expires_at > starts_at)
);

-- Guest access system
CREATE TABLE IF NOT EXISTS public.guest_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Guest identification
  email TEXT NOT NULL,
  full_name TEXT,
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Access configuration
  role_id UUID REFERENCES public.roles(id),
  permissions JSONB DEFAULT '{}',
  resource_access JSONB DEFAULT '{}', -- Specific resources they can access
  
  -- Time constraints
  expires_at TIMESTAMPTZ NOT NULL,
  max_sessions INTEGER DEFAULT 1,
  
  -- Status tracking
  is_active BOOLEAN DEFAULT TRUE,
  first_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, email)
);

-- =====================================================
-- PERMISSION AUDIT AND ANALYTICS
-- =====================================================

-- Permission usage tracking
CREATE TABLE IF NOT EXISTS public.permission_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Usage details
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  resource_id TEXT,
  
  -- Context
  endpoint TEXT, -- API endpoint or UI action
  method TEXT, -- HTTP method or action type
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  -- Result
  was_granted BOOLEAN NOT NULL,
  denial_reason TEXT, -- If was_granted = false
  
  -- Timing
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER
);

-- Role assignment history
CREATE TABLE IF NOT EXISTS public.role_assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Assignment details
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL, -- 'assigned', 'revoked', 'expired'
  performed_by UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT,
  
  -- Timing
  effective_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Role hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_parent_role_id ON public.roles(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_path ON public.roles USING GIN(hierarchy_path gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active) WHERE is_active = true;

-- Permission indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON public.permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON public.permissions(scope);

-- Role-Permission mapping indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_id ON public.role_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_inherited_from ON public.role_permissions(inherited_from_role_id);

-- User-Role assignment indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON public.departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_hierarchy_path ON public.departments USING GIN(hierarchy_path gin_trgm_ops);

-- User-Department indexes
CREATE INDEX IF NOT EXISTS idx_user_departments_tenant_id ON public.user_departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON public.user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON public.user_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_primary ON public.user_departments(is_primary) WHERE is_primary = true;

-- Delegation indexes
CREATE INDEX IF NOT EXISTS idx_permission_delegations_tenant_id ON public.permission_delegations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_delegator ON public.permission_delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_delegatee ON public.permission_delegations(delegatee_id);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_status ON public.permission_delegations(status);
CREATE INDEX IF NOT EXISTS idx_permission_delegations_expires_at ON public.permission_delegations(expires_at);

-- Guest access indexes
CREATE INDEX IF NOT EXISTS idx_guest_access_tenant_id ON public.guest_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guest_access_email ON public.guest_access(email);
CREATE INDEX IF NOT EXISTS idx_guest_access_expires_at ON public.guest_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_guest_access_active ON public.guest_access(is_active) WHERE is_active = true;

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_permission_usage_tenant_id ON public.permission_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_usage_user_id ON public.permission_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_usage_permission_id ON public.permission_usage(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_usage_timestamp ON public.permission_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_permission_usage_resource ON public.permission_usage(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_role_assignment_history_tenant_id ON public.role_assignment_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_assignment_history_user_id ON public.role_assignment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignment_history_role_id ON public.role_assignment_history(role_id);
CREATE INDEX IF NOT EXISTS idx_role_assignment_history_effective_at ON public.role_assignment_history(effective_at);

-- =====================================================
-- FUNCTIONS FOR HIERARCHY MANAGEMENT
-- =====================================================

-- Function to update role hierarchy path
CREATE OR REPLACE FUNCTION update_role_hierarchy_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_role_id IS NULL THEN
    NEW.hierarchy_path := NEW.id::text;
    NEW.level := 0;
  ELSE
    SELECT 
      COALESCE(hierarchy_path, '') || '.' || NEW.id::text,
      COALESCE(level, 0) + 1
    INTO NEW.hierarchy_path, NEW.level
    FROM public.roles 
    WHERE id = NEW.parent_role_id AND tenant_id = NEW.tenant_id;
    
    -- Prevent circular references
    IF NEW.hierarchy_path LIKE '%' || NEW.id::text || '.%' THEN
      RAISE EXCEPTION 'Circular reference detected in role hierarchy';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for role hierarchy path updates
DROP TRIGGER IF EXISTS trigger_update_role_hierarchy_path ON public.roles;
CREATE TRIGGER trigger_update_role_hierarchy_path
  BEFORE INSERT OR UPDATE OF parent_role_id ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_role_hierarchy_path();

-- Function to update department hierarchy path
CREATE OR REPLACE FUNCTION update_department_hierarchy_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_department_id IS NULL THEN
    NEW.hierarchy_path := NEW.id::text;
    NEW.level := 0;
  ELSE
    SELECT 
      COALESCE(hierarchy_path, '') || '.' || NEW.id::text,
      COALESCE(level, 0) + 1
    INTO NEW.hierarchy_path, NEW.level
    FROM public.departments 
    WHERE id = NEW.parent_department_id AND tenant_id = NEW.tenant_id;
    
    -- Prevent circular references
    IF NEW.hierarchy_path LIKE '%' || NEW.id::text || '.%' THEN
      RAISE EXCEPTION 'Circular reference detected in department hierarchy';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for department hierarchy path updates
DROP TRIGGER IF EXISTS trigger_update_department_hierarchy_path ON public.departments;
CREATE TRIGGER trigger_update_department_hierarchy_path
  BEFORE INSERT OR UPDATE OF parent_department_id ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION update_department_hierarchy_path();

-- =====================================================
-- PERMISSION CHECKING FUNCTIONS
-- =====================================================

-- Function to get all permissions for a user (including inherited)
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_tenant_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  permission_name TEXT,
  resource_type resource_type,
  action permission_action,
  scope permission_scope,
  conditions JSONB,
  resource_filters JSONB,
  source TEXT -- 'direct', 'inherited', 'delegated'
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE role_hierarchy AS (
    -- Direct roles
    SELECT 
      r.id,
      r.name,
      r.parent_role_id,
      r.hierarchy_path,
      'direct'::TEXT as source
    FROM public.roles r
    JOIN public.user_roles ur ON ur.role_id = r.id
    WHERE ur.tenant_id = p_tenant_id 
      AND ur.user_id = p_user_id 
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    
    UNION ALL
    
    -- Inherited roles through hierarchy
    SELECT 
      r.id,
      r.name,
      r.parent_role_id,
      r.hierarchy_path,
      'inherited'::TEXT as source
    FROM public.roles r
    JOIN role_hierarchy rh ON r.id = rh.parent_role_id
    WHERE r.tenant_id = p_tenant_id
      AND r.is_active = true
  ),
  delegated_permissions AS (
    -- Delegated permissions
    SELECT DISTINCT
      p.name as permission_name,
      p.resource_type,
      p.action,
      p.scope,
      pd.conditions,
      pd.resource_filters,
      'delegated'::TEXT as source
    FROM public.permission_delegations pd
    JOIN public.permissions p ON p.id = ANY(pd.permission_ids)
    WHERE pd.tenant_id = p_tenant_id
      AND pd.delegatee_id = p_user_id
      AND pd.status = 'active'
      AND pd.starts_at <= NOW()
      AND pd.expires_at > NOW()
  )
  
  -- Combine all permissions
  SELECT DISTINCT
    p.name as permission_name,
    p.resource_type,
    p.action,
    p.scope,
    COALESCE(rp.conditions, '{}'::JSONB) as conditions,
    COALESCE(rp.resource_filters, '{}'::JSONB) as resource_filters,
    rh.source
  FROM role_hierarchy rh
  JOIN public.role_permissions rp ON rp.role_id = rh.id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE rp.tenant_id = p_tenant_id
  
  UNION ALL
  
  SELECT * FROM delegated_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_tenant_id UUID,
  p_user_id UUID,
  p_permission_name TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM get_user_permissions(p_tenant_id, p_user_id) up
    WHERE up.permission_name = p_permission_name
      -- Add resource filter checks here if needed
      -- AND (up.resource_filters IS NULL OR check_resource_filters(up.resource_filters, p_resource_id))
      -- Add condition checks here if needed
      -- AND (up.conditions IS NULL OR check_conditions(up.conditions, p_context))
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all RBAC tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Users can view roles in their tenant" ON public.roles
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users with manage:role permission can modify roles" ON public.roles
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND
    user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:role')
  );

-- RLS Policies for permissions table (system-wide, read-only for most users)
CREATE POLICY "Users can view system permissions" ON public.permissions
  FOR SELECT USING (true);

-- RLS Policies for role_permissions table
CREATE POLICY "Users can view role permissions in their tenant" ON public.role_permissions
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users with manage:role permission can modify role permissions" ON public.role_permissions
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND
    user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:role')
  );

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own role assignments" ON public.user_roles
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND
    (user_id = auth.uid() OR user_has_permission(get_current_tenant_id(), auth.uid(), 'read:user'))
  );

CREATE POLICY "Users with manage:user permission can modify role assignments" ON public.user_roles
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND
    user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:user')
  );

-- RLS Policies for departments table
CREATE POLICY "Users can view departments in their tenant" ON public.departments
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users with manage:department permission can modify departments" ON public.departments
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND
    user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:department')
  );

-- RLS Policies for user_departments table
CREATE POLICY "Users can view department assignments in their tenant" ON public.user_departments
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND
    (user_id = auth.uid() OR user_has_permission(get_current_tenant_id(), auth.uid(), 'read:user'))
  );

CREATE POLICY "Users with manage:user permission can modify department assignments" ON public.user_departments
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND
    user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:user')
  );

-- RLS Policies for permission_delegations table
CREATE POLICY "Users can view delegations they're involved in" ON public.permission_delegations
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND
    (delegator_id = auth.uid() OR delegatee_id = auth.uid() OR 
     user_has_permission(get_current_tenant_id(), auth.uid(), 'read:delegation'))
  );

CREATE POLICY "Users can create delegations for their own permissions" ON public.permission_delegations
  FOR INSERT WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    delegator_id = auth.uid()
  );

CREATE POLICY "Users can modify their own delegations" ON public.permission_delegations
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id() AND
    (delegator_id = auth.uid() OR user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:delegation'))
  );

-- RLS Policies for guest_access table
CREATE POLICY "Users with manage:user permission can manage guest access" ON public.guest_access
  FOR ALL USING (
    tenant_id = get_current_tenant_id() AND
    user_has_permission(get_current_tenant_id(), auth.uid(), 'manage:user')
  );

-- RLS Policies for audit tables
CREATE POLICY "Users with read:audit permission can view permission usage" ON public.permission_usage
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND
    (user_id = auth.uid() OR user_has_permission(get_current_tenant_id(), auth.uid(), 'read:audit'))
  );

CREATE POLICY "Users with read:audit permission can view role assignment history" ON public.role_assignment_history
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() AND
    (user_id = auth.uid() OR user_has_permission(get_current_tenant_id(), auth.uid(), 'read:audit'))
  );

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================

-- Insert system permissions
INSERT INTO public.permissions (name, display_name, description, resource_type, action, scope, is_system_permission) VALUES
-- Asset permissions
('create:asset', 'Create Assets', 'Create new assets', 'asset', 'create', 'tenant', true),
('read:asset', 'View Assets', 'View asset information', 'asset', 'read', 'tenant', true),
('update:asset', 'Update Assets', 'Modify asset information', 'asset', 'update', 'tenant', true),
('delete:asset', 'Delete Assets', 'Delete assets', 'asset', 'delete', 'tenant', true),
('assign:asset', 'Assign Assets', 'Assign assets to users', 'asset', 'assign', 'tenant', true),
('transfer:asset', 'Transfer Assets', 'Transfer assets between locations/users', 'asset', 'transfer', 'tenant', true),
('manage:asset', 'Manage Assets', 'Full asset management capabilities', 'asset', 'manage', 'tenant', true),

-- User permissions
('create:user', 'Create Users', 'Create new user accounts', 'user', 'create', 'tenant', true),
('read:user', 'View Users', 'View user information', 'user', 'read', 'tenant', true),
('update:user', 'Update Users', 'Modify user information', 'user', 'update', 'tenant', true),
('delete:user', 'Delete Users', 'Delete user accounts', 'user', 'delete', 'tenant', true),
('manage:user', 'Manage Users', 'Full user management capabilities', 'user', 'manage', 'tenant', true),

-- Role permissions
('create:role', 'Create Roles', 'Create new roles', 'role', 'create', 'tenant', true),
('read:role', 'View Roles', 'View role information', 'role', 'read', 'tenant', true),
('update:role', 'Update Roles', 'Modify role information', 'role', 'update', 'tenant', true),
('delete:role', 'Delete Roles', 'Delete roles', 'role', 'delete', 'tenant', true),
('manage:role', 'Manage Roles', 'Full role management capabilities', 'role', 'manage', 'tenant', true),

-- Department permissions
('create:department', 'Create Departments', 'Create new departments', 'department', 'create', 'tenant', true),
('read:department', 'View Departments', 'View department information', 'department', 'read', 'tenant', true),
('update:department', 'Update Departments', 'Modify department information', 'department', 'update', 'tenant', true),
('delete:department', 'Delete Departments', 'Delete departments', 'department', 'delete', 'tenant', true),
('manage:department', 'Manage Departments', 'Full department management capabilities', 'department', 'manage', 'tenant', true),

-- Report permissions
('create:report', 'Create Reports', 'Create custom reports', 'report', 'create', 'tenant', true),
('read:report', 'View Reports', 'View reports and analytics', 'report', 'read', 'tenant', true),
('update:report', 'Update Reports', 'Modify reports', 'report', 'update', 'tenant', true),
('delete:report', 'Delete Reports', 'Delete reports', 'report', 'delete', 'tenant', true),
('export:report', 'Export Reports', 'Export reports to various formats', 'report', 'export', 'tenant', true),

-- Setting permissions
('read:setting', 'View Settings', 'View system settings', 'setting', 'read', 'tenant', true),
('update:setting', 'Update Settings', 'Modify system settings', 'setting', 'update', 'tenant', true),
('manage:setting', 'Manage Settings', 'Full settings management capabilities', 'setting', 'manage', 'tenant', true),

-- Audit permissions
('read:audit', 'View Audit Logs', 'View audit logs and security events', 'audit', 'read', 'tenant', true),
('export:audit', 'Export Audit Logs', 'Export audit logs', 'audit', 'export', 'tenant', true),

-- Maintenance permissions
('create:maintenance', 'Create Maintenance', 'Create maintenance schedules', 'maintenance', 'create', 'tenant', true),
('read:maintenance', 'View Maintenance', 'View maintenance information', 'maintenance', 'read', 'tenant', true),
('update:maintenance', 'Update Maintenance', 'Modify maintenance schedules', 'maintenance', 'update', 'tenant', true),
('delete:maintenance', 'Delete Maintenance', 'Delete maintenance schedules', 'maintenance', 'delete', 'tenant', true),
('approve:maintenance', 'Approve Maintenance', 'Approve maintenance requests', 'maintenance', 'approve', 'tenant', true),

-- Geofence permissions
('create:geofence', 'Create Geofences', 'Create geofence zones', 'geofence', 'create', 'tenant', true),
('read:geofence', 'View Geofences', 'View geofence information', 'geofence', 'read', 'tenant', true),
('update:geofence', 'Update Geofences', 'Modify geofence zones', 'geofence', 'update', 'tenant', true),
('delete:geofence', 'Delete Geofences', 'Delete geofence zones', 'geofence', 'delete', 'tenant', true),

-- IoT Device permissions
('create:iot_device', 'Create IoT Devices', 'Register new IoT devices', 'iot_device', 'create', 'tenant', true),
('read:iot_device', 'View IoT Devices', 'View IoT device information', 'iot_device', 'read', 'tenant', true),
('update:iot_device', 'Update IoT Devices', 'Modify IoT device settings', 'iot_device', 'update', 'tenant', true),
('delete:iot_device', 'Delete IoT Devices', 'Remove IoT devices', 'iot_device', 'delete', 'tenant', true),
('manage:iot_device', 'Manage IoT Devices', 'Full IoT device management capabilities', 'iot_device', 'manage', 'tenant', true)

ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS FOR ROLE MANAGEMENT
-- =====================================================

-- Function to create a new role with permissions
CREATE OR REPLACE FUNCTION create_role_with_permissions(
  p_tenant_id UUID,
  p_name TEXT,
  p_display_name TEXT,
  p_description TEXT,
  p_parent_role_id UUID DEFAULT NULL,
  p_permission_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
  v_permission_name TEXT;
BEGIN
  -- Create the role
  INSERT INTO public.roles (tenant_id, name, display_name, description, parent_role_id, created_by)
  VALUES (p_tenant_id, p_name, p_display_name, p_description, p_parent_role_id, p_created_by)
  RETURNING id INTO v_role_id;
  
  -- Add permissions
  FOREACH v_permission_name IN ARRAY p_permission_names
  LOOP
    SELECT id INTO v_permission_id 
    FROM public.permissions 
    WHERE name = v_permission_name;
    
    IF v_permission_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (tenant_id, role_id, permission_id)
      VALUES (p_tenant_id, v_role_id, v_permission_id)
      ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_role_to_user(
  p_tenant_id UUID,
  p_user_id UUID,
  p_role_id UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  INSERT INTO public.user_roles (tenant_id, user_id, role_id, expires_at, assigned_by)
  VALUES (p_tenant_id, p_user_id, p_role_id, p_expires_at, p_assigned_by)
  ON CONFLICT (tenant_id, user_id, role_id) 
  DO UPDATE SET 
    expires_at = EXCLUDED.expires_at,
    is_active = true
  RETURNING id INTO v_assignment_id;
  
  -- Log the assignment
  INSERT INTO public.role_assignment_history (tenant_id, user_id, role_id, action, performed_by, expires_at)
  VALUES (p_tenant_id, p_user_id, p_role_id, 'assigned', p_assigned_by, p_expires_at);
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke role from user
CREATE OR REPLACE FUNCTION revoke_role_from_user(
  p_tenant_id UUID,
  p_user_id UUID,
  p_role_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_revoked_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_roles 
  SET is_active = false
  WHERE tenant_id = p_tenant_id 
    AND user_id = p_user_id 
    AND role_id = p_role_id;
  
  -- Log the revocation
  INSERT INTO public.role_assignment_history (tenant_id, user_id, role_id, action, performed_by, reason)
  VALUES (p_tenant_id, p_user_id, p_role_id, 'revoked', p_revoked_by, p_reason);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up expired delegations
CREATE OR REPLACE FUNCTION cleanup_expired_delegations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.permission_delegations 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired guest access
CREATE OR REPLACE FUNCTION cleanup_expired_guest_access()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.guest_access 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired role assignments
CREATE OR REPLACE FUNCTION cleanup_expired_role_assignments()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.user_roles 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at <= NOW();
  
  -- Log the expirations
  INSERT INTO public.role_assignment_history (tenant_id, user_id, role_id, action, performed_by)
  SELECT tenant_id, user_id, role_id, 'expired', NULL
  FROM public.user_roles 
  WHERE is_active = false 
    AND expires_at IS NOT NULL 
    AND expires_at <= NOW()
    AND updated_at >= NOW() - INTERVAL '1 minute'; -- Only recently expired
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.roles IS 'Hierarchical role definitions with inheritance support';
COMMENT ON TABLE public.permissions IS 'System-wide permission definitions';
COMMENT ON TABLE public.role_permissions IS 'Mapping between roles and permissions with inheritance tracking';
COMMENT ON TABLE public.user_roles IS 'User role assignments with expiration support';
COMMENT ON TABLE public.departments IS 'Organizational department hierarchy';
COMMENT ON TABLE public.user_departments IS 'User department assignments';
COMMENT ON TABLE public.department_roles IS 'Department-specific role assignments';
COMMENT ON TABLE public.permission_delegations IS 'Temporary permission delegations between users';
COMMENT ON TABLE public.guest_access IS 'Guest access management with time-limited permissions';
COMMENT ON TABLE public.permission_usage IS 'Audit trail of permission usage';
COMMENT ON TABLE public.role_assignment_history IS 'History of role assignments and changes';

COMMENT ON FUNCTION get_user_permissions(UUID, UUID) IS 'Returns all permissions for a user including inherited and delegated permissions';
COMMENT ON FUNCTION user_has_permission(UUID, UUID, TEXT, TEXT, JSONB) IS 'Checks if a user has a specific permission with optional resource and context filters';
COMMENT ON FUNCTION create_role_with_permissions(UUID, TEXT, TEXT, TEXT, UUID, TEXT[], UUID) IS 'Creates a new role and assigns specified permissions';
COMMENT ON FUNCTION assign_role_to_user(UUID, UUID, UUID, TIMESTAMPTZ, UUID) IS 'Assigns a role to a user with optional expiration';
COMMENT ON FUNCTION revoke_role_from_user(UUID, UUID, UUID, TEXT, UUID) IS 'Revokes a role from a user with audit logging';