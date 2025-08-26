-- =====================================================
-- HIERARCHICAL ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- RBAC CUSTOM TYPES AND ENUMS
-- =====================================================

-- Permission scope enum
DO $$ BEGIN
    CREATE TYPE permission_scope AS ENUM ('global', 'tenant', 'department', 'personal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Permission action enum
DO $$ BEGIN
    CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'assign', 'transfer', 'approve', 'export', 'import', 'manage');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Resource type enum
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('asset', 'user', 'role', 'department', 'report', 'setting', 'audit', 'maintenance', 'geofence', 'iot_device');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Delegation status enum
DO $$ BEGIN
    CREATE TYPE delegation_status AS ENUM ('active', 'expired', 'revoked', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Department type enum
DO $$ BEGIN
    CREATE TYPE department_type AS ENUM ('operational', 'administrative', 'technical', 'financial', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ENHANCED ROLES TABLE
-- =====================================================

-- Drop existing roles table if it exists (backup data first if needed)
-- ALTER TABLE IF EXISTS public.roles RENAME TO roles_backup;

-- Create enhanced roles table
CREATE TABLE IF NOT EXISTS public.roles_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Role identification
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy support
  parent_role_id UUID REFERENCES public.roles_new(id),
  level INTEGER DEFAULT 0,
  hierarchy_path TEXT,
  
  -- Role configuration
  is_system_role BOOLEAN DEFAULT FALSE,
  is_default_role BOOLEAN DEFAULT FALSE,
  max_users INTEGER,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name),
  CHECK (parent_role_id != id)
);

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================

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

-- =====================================================
-- ROLE-PERMISSION MAPPING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles_new(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  
  -- Permission constraints
  conditions JSONB DEFAULT '{}',
  resource_filters JSONB DEFAULT '{}',
  
  -- Inheritance tracking
  inherited_from_role_id UUID REFERENCES public.roles_new(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, role_id, permission_id)
);

-- =====================================================
-- USER-ROLE ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles_new(id) ON DELETE CASCADE,
  
  -- Assignment metadata
  assigned_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(tenant_id, user_id, role_id)
);

-- =====================================================
-- BASIC INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_roles_new_tenant_id ON public.roles_new(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_new_parent_role_id ON public.roles_new(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_new_is_active ON public.roles_new(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON public.permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);

CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_id ON public.role_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;

-- =====================================================
-- BASIC FUNCTIONS
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
    FROM public.roles_new 
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
DROP TRIGGER IF EXISTS trigger_update_role_hierarchy_path ON public.roles_new;
CREATE TRIGGER trigger_update_role_hierarchy_path
  BEFORE INSERT OR UPDATE OF parent_role_id ON public.roles_new
  FOR EACH ROW
  EXECUTE FUNCTION update_role_hierarchy_path();

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================

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
-- UTILITY FUNCTIONS
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
  INSERT INTO public.roles_new (tenant_id, name, display_name, description, parent_role_id, created_by)
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
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;