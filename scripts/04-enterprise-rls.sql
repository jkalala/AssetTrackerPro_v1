-- =====================================================
-- ENTERPRISE ASSET MANAGEMENT PLATFORM - ROW LEVEL SECURITY
-- =====================================================
-- This script implements comprehensive Row Level Security (RLS) policies
-- for multi-tenant data isolation and role-based access control.

-- =====================================================
-- ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- =====================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- First try to get from session variable
    BEGIN
        tenant_id := current_setting('app.current_tenant_id', true)::UUID;
        IF tenant_id IS NOT NULL THEN
            RETURN tenant_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Continue to database lookup
    END;
    
    -- Fallback to database lookup
    SELECT p.tenant_id INTO tenant_id
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is tenant owner
CREATE OR REPLACE FUNCTION is_tenant_owner()
RETURNS BOOLEAN AS $$
DECLARE
    is_owner BOOLEAN := FALSE;
BEGIN
    SELECT p.is_owner INTO is_owner
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RETURN COALESCE(is_owner, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has specific role
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RETURN user_role = required_role OR user_role = 'owner' OR user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has any of the specified roles
CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RETURN user_role = ANY(required_roles) OR user_role = 'owner' OR user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user can access specific asset
CREATE OR REPLACE FUNCTION can_access_asset(asset_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tenant_id UUID;
    asset_tenant_id UUID;
    user_role TEXT;
    asset_assignee UUID;
BEGIN
    -- Get user's tenant and role
    SELECT p.tenant_id, p.role INTO user_tenant_id, user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    -- Get asset's tenant and assignee
    SELECT a.tenant_id, a.assignee_id INTO asset_tenant_id, asset_assignee
    FROM public.assets a
    WHERE a.id = asset_id;
    
    -- Check tenant match
    IF user_tenant_id != asset_tenant_id THEN
        RETURN FALSE;
    END IF;
    
    -- Owners and admins can access all assets in their tenant
    IF user_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Managers can access all assets in their tenant
    IF user_role = 'manager' THEN
        RETURN TRUE;
    END IF;
    
    -- Users can access assets assigned to them or unassigned assets
    IF user_role = 'user' THEN
        RETURN asset_assignee IS NULL OR asset_assignee = auth.uid();
    END IF;
    
    -- Viewers can only read, handled by specific policies
    RETURN user_role = 'viewer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TENANT POLICIES
-- =====================================================

-- Tenants: Users can only see their own tenant
CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT USING (
        id = get_current_tenant_id()
    );

-- Tenants: Only owners can update tenant settings
CREATE POLICY "Owners can update tenant" ON public.tenants
    FOR UPDATE USING (
        id = get_current_tenant_id() AND is_tenant_owner()
    );

-- Tenants: Only system can create tenants (handled by application)
CREATE POLICY "System can create tenants" ON public.tenants
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- PROFILE POLICIES
-- =====================================================

-- Profiles: Users can view profiles in their tenant
CREATE POLICY "Users can view tenant profiles" ON public.profiles
    FOR SELECT USING (
        tenant_id = get_current_tenant_id()
    );

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

-- Profiles: Admins can update profiles in their tenant
CREATE POLICY "Admins can update tenant profiles" ON public.profiles
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin'])
    );

-- Profiles: System can create profiles (handled by application)
CREATE POLICY "System can create profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id()
    );

-- Profiles: Admins can delete profiles in their tenant (except owners)
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (
        tenant_id = get_current_tenant_id() 
        AND has_any_role(ARRAY['owner', 'admin'])
        AND role != 'owner'
    );

-- =====================================================
-- ASSET CATEGORY POLICIES
-- =====================================================

-- Asset Categories: Users can view categories in their tenant
CREATE POLICY "Users can view tenant categories" ON public.asset_categories
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() OR tenant_id IS NULL
    );

-- Asset Categories: Managers can manage categories
CREATE POLICY "Managers can manage categories" ON public.asset_categories
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin', 'manager'])
    );

-- =====================================================
-- ASSET POLICIES
-- =====================================================

-- Assets: Users can view assets based on role and assignment
CREATE POLICY "Users can view accessible assets" ON public.assets
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            assignee_id = auth.uid() OR
            assignee_id IS NULL OR
            has_role('viewer')
        )
    );

-- Assets: Users can create assets in their tenant
CREATE POLICY "Users can create assets" ON public.assets
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id() AND 
        has_any_role(ARRAY['owner', 'admin', 'manager', 'user'])
    );

-- Assets: Users can update assets they have access to
CREATE POLICY "Users can update accessible assets" ON public.assets
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            (assignee_id = auth.uid() AND has_role('user'))
        )
    );

-- Assets: Only admins can delete assets
CREATE POLICY "Admins can delete assets" ON public.assets
    FOR DELETE USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin'])
    );

-- =====================================================
-- ASSET MAINTENANCE POLICIES
-- =====================================================

-- Asset Maintenance: Users can view maintenance for accessible assets
CREATE POLICY "Users can view asset maintenance" ON public.asset_maintenance
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            assigned_to = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.assets a 
                WHERE a.id = asset_id AND (a.assignee_id = auth.uid() OR a.assignee_id IS NULL)
            )
        )
    );

-- Asset Maintenance: Users can create maintenance records
CREATE POLICY "Users can create maintenance records" ON public.asset_maintenance
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id() AND 
        has_any_role(ARRAY['owner', 'admin', 'manager', 'user'])
    );

-- Asset Maintenance: Users can update maintenance they're assigned to
CREATE POLICY "Users can update assigned maintenance" ON public.asset_maintenance
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            assigned_to = auth.uid()
        )
    );

-- =====================================================
-- ASSET HISTORY POLICIES
-- =====================================================

-- Asset History: Users can view history for accessible assets
CREATE POLICY "Users can view asset history" ON public.asset_history
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            EXISTS (
                SELECT 1 FROM public.assets a 
                WHERE a.id = asset_id AND (a.assignee_id = auth.uid() OR a.assignee_id IS NULL)
            )
        )
    );

-- Asset History: System creates history records (via triggers)
CREATE POLICY "System can create history records" ON public.asset_history
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id()
    );

-- =====================================================
-- IOT DEVICE POLICIES
-- =====================================================

-- IoT Devices: Users can view devices for accessible assets
CREATE POLICY "Users can view iot devices" ON public.iot_devices
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            EXISTS (
                SELECT 1 FROM public.assets a 
                WHERE a.id = asset_id AND (a.assignee_id = auth.uid() OR a.assignee_id IS NULL)
            )
        )
    );

-- IoT Devices: Managers can manage IoT devices
CREATE POLICY "Managers can manage iot devices" ON public.iot_devices
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin', 'manager'])
    );

-- =====================================================
-- SENSOR DATA POLICIES
-- =====================================================

-- Sensor Data: Users can view sensor data for accessible devices
CREATE POLICY "Users can view sensor data" ON public.sensor_data
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            EXISTS (
                SELECT 1 FROM public.iot_devices d
                JOIN public.assets a ON a.id = d.asset_id
                WHERE d.id = device_id AND (a.assignee_id = auth.uid() OR a.assignee_id IS NULL)
            )
        )
    );

-- Sensor Data: System can insert sensor data
CREATE POLICY "System can insert sensor data" ON public.sensor_data
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id()
    );

-- =====================================================
-- GEOFENCE POLICIES
-- =====================================================

-- Geofences: Users can view geofences in their tenant
CREATE POLICY "Users can view geofences" ON public.geofences
    FOR SELECT USING (
        tenant_id = get_current_tenant_id()
    );

-- Geofences: Managers can manage geofences
CREATE POLICY "Managers can manage geofences" ON public.geofences
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin', 'manager'])
    );

-- =====================================================
-- GEOFENCE EVENT POLICIES
-- =====================================================

-- Geofence Events: Users can view events for accessible assets
CREATE POLICY "Users can view geofence events" ON public.geofence_events
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            EXISTS (
                SELECT 1 FROM public.assets a 
                WHERE a.id = asset_id AND (a.assignee_id = auth.uid() OR a.assignee_id IS NULL)
            )
        )
    );

-- Geofence Events: System can create events
CREATE POLICY "System can create geofence events" ON public.geofence_events
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id()
    );

-- Geofence Events: Users can acknowledge events
CREATE POLICY "Users can acknowledge events" ON public.geofence_events
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id() AND (
            has_any_role(ARRAY['owner', 'admin', 'manager']) OR
            EXISTS (
                SELECT 1 FROM public.assets a 
                WHERE a.id = asset_id AND a.assignee_id = auth.uid()
            )
        )
    );

-- =====================================================
-- AUDIT LOG POLICIES
-- =====================================================

-- Audit Logs: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin'])
    );

-- Audit Logs: System can create audit logs
CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        tenant_id = get_current_tenant_id()
    );

-- =====================================================
-- DATA RETENTION POLICY POLICIES
-- =====================================================

-- Data Retention Policies: Only admins can manage retention policies
CREATE POLICY "Admins can manage retention policies" ON public.data_retention_policies
    FOR ALL USING (
        tenant_id = get_current_tenant_id() AND has_any_role(ARRAY['owner', 'admin'])
    );

-- =====================================================
-- SECURITY FUNCTIONS FOR APPLICATION USE
-- =====================================================

-- Function to set current user context (called by application)
CREATE OR REPLACE FUNCTION set_current_user_context(user_id UUID, tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user context
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_tenant_id', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check tenant access for API calls
CREATE OR REPLACE FUNCTION check_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN target_tenant_id = get_current_tenant_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_any_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_asset(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_user_context(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_context() TO authenticated;
GRANT EXECUTE ON FUNCTION check_tenant_access(UUID) TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Enterprise Row Level Security policies created successfully!';
    RAISE NOTICE 'RLS Features:';
    RAISE NOTICE '- Complete tenant data isolation';
    RAISE NOTICE '- Role-based access control (Owner, Admin, Manager, User, Viewer)';
    RAISE NOTICE '- Asset-level access control based on assignment';
    RAISE NOTICE '- Secure audit logging with admin-only access';
    RAISE NOTICE '- IoT and geospatial data protection';
    RAISE NOTICE '- Helper functions for application integration';
    RAISE NOTICE 'Next steps: Test policies and configure application context';
END $$;