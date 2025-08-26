-- =====================================================
-- TENANT ISOLATION CONSTRAINTS MIGRATION
-- =====================================================
-- This script adds additional tenant isolation constraints and security measures

-- First, create a basic function that doesn't depend on tenant_id column existing yet
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Try to get from session setting first
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        -- If no session setting, try to get from profiles table if column exists
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
                RETURN (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1);
            ELSE
                RETURN NULL;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN NULL;
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION has_any_role(roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_user_role', true) = ANY(roles),
        FALSE
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add tenant_id to profiles table if not exists (for better tenant isolation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
        
        -- Update existing profiles to have tenant_id (assign to default tenant if exists)
        UPDATE profiles 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Add tenant_id columns to tables that don't have them yet

-- Asset location history - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_location_history') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'asset_location_history' AND column_name = 'tenant_id') THEN
        ALTER TABLE asset_location_history ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_asset_location_history_tenant_id ON asset_location_history(tenant_id);
        
        -- Update existing records
        UPDATE asset_location_history 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Geofence zones - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofence_zones') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'geofence_zones' AND column_name = 'tenant_id') THEN
        ALTER TABLE geofence_zones ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_geofence_zones_tenant_id ON geofence_zones(tenant_id);
        
        -- Update existing records
        UPDATE geofence_zones 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Asset attachments - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_attachments') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'asset_attachments' AND column_name = 'tenant_id') THEN
        ALTER TABLE asset_attachments ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_asset_attachments_tenant_id ON asset_attachments(tenant_id);
        
        -- Update existing records
        UPDATE asset_attachments 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Custom reports - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_reports') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'custom_reports' AND column_name = 'tenant_id') THEN
        ALTER TABLE custom_reports ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_custom_reports_tenant_id ON custom_reports(tenant_id);
        
        -- Update existing records
        UPDATE custom_reports 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Asset maintenance schedules - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_maintenance_schedules') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'asset_maintenance_schedules' AND column_name = 'tenant_id') THEN
        ALTER TABLE asset_maintenance_schedules ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_asset_maintenance_schedules_tenant_id ON asset_maintenance_schedules(tenant_id);
        
        -- Update existing records
        UPDATE asset_maintenance_schedules 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Asset lifecycle rules - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_lifecycle_rules') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'asset_lifecycle_rules' AND column_name = 'tenant_id') THEN
        ALTER TABLE asset_lifecycle_rules ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_asset_lifecycle_rules_tenant_id ON asset_lifecycle_rules(tenant_id);
        
        -- Update existing records
        UPDATE asset_lifecycle_rules 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Asset categories - add tenant_id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_categories') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'asset_categories' AND column_name = 'tenant_id') THEN
        ALTER TABLE asset_categories ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_asset_categories_tenant_id ON asset_categories(tenant_id);
        
        -- Update existing records
        UPDATE asset_categories 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Add tenant isolation constraints to existing tables that already have tenant_id

-- Assets table tenant isolation (should already have tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assets' AND column_name = 'tenant_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE constraint_name = 'fk_assets_tenant_id' AND table_name = 'assets') THEN
        ALTER TABLE assets 
        ADD CONSTRAINT fk_assets_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Geofence events tenant isolation (should already have tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'geofence_events' AND column_name = 'tenant_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE constraint_name = 'fk_geofence_events_tenant_id' AND table_name = 'geofence_events') THEN
        ALTER TABLE geofence_events 
        ADD CONSTRAINT fk_geofence_events_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- QR templates tenant isolation (should already have tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'qr_templates' AND column_name = 'tenant_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE constraint_name = 'fk_qr_templates_tenant_id' AND table_name = 'qr_templates') THEN
        ALTER TABLE qr_templates 
        ADD CONSTRAINT fk_qr_templates_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Asset custom field values - add tenant_id column (asset_field_definitions already has it)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_custom_field_values') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'asset_custom_field_values' AND column_name = 'tenant_id') THEN
        ALTER TABLE asset_custom_field_values ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_asset_custom_field_values_tenant_id ON asset_custom_field_values(tenant_id);
        
        -- Update existing records
        UPDATE asset_custom_field_values 
        SET tenant_id = (SELECT id FROM tenants LIMIT 1)
        WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM tenants);
    END IF;
END $$;

-- Asset field definitions tenant isolation (should already have tenant_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'asset_field_definitions' AND column_name = 'tenant_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE constraint_name = 'fk_asset_field_definitions_tenant_id' AND table_name = 'asset_field_definitions') THEN
        ALTER TABLE asset_field_definitions 
        ADD CONSTRAINT fk_asset_field_definitions_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;



-- Update the get_current_tenant_id function now that tenant_id columns exist
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce tenant isolation in queries
CREATE OR REPLACE FUNCTION enforce_tenant_isolation()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        NEW.tenant_id := get_current_tenant_id();
        RETURN NEW;
    END IF;
    
    -- For UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- Prevent changing tenant_id
        IF OLD.tenant_id != NEW.tenant_id THEN
            RAISE EXCEPTION 'Cannot change tenant_id';
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add tenant isolation triggers to key tables (only if tables exist)
DO $$
BEGIN
    -- Profiles trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_profiles ON profiles;
        CREATE TRIGGER enforce_tenant_isolation_profiles
            BEFORE INSERT OR UPDATE ON profiles
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Assets trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_assets ON assets;
        CREATE TRIGGER enforce_tenant_isolation_assets
            BEFORE INSERT OR UPDATE ON assets
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- API keys trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_api_keys ON api_keys;
        CREATE TRIGGER enforce_tenant_isolation_api_keys
            BEFORE INSERT OR UPDATE ON api_keys
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- User sessions trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_user_sessions ON user_sessions;
        CREATE TRIGGER enforce_tenant_isolation_user_sessions
            BEFORE INSERT OR UPDATE ON user_sessions
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- MFA configurations trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mfa_configurations') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_mfa_configurations ON mfa_configurations;
        CREATE TRIGGER enforce_tenant_isolation_mfa_configurations
            BEFORE INSERT OR UPDATE ON mfa_configurations
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Security events trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_events') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_security_events ON security_events;
        CREATE TRIGGER enforce_tenant_isolation_security_events
            BEFORE INSERT OR UPDATE ON security_events
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Asset location history trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_location_history') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_asset_location_history ON asset_location_history;
        CREATE TRIGGER enforce_tenant_isolation_asset_location_history
            BEFORE INSERT OR UPDATE ON asset_location_history
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Geofence zones trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofence_zones') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_geofence_zones ON geofence_zones;
        CREATE TRIGGER enforce_tenant_isolation_geofence_zones
            BEFORE INSERT OR UPDATE ON geofence_zones
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Asset attachments trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_attachments') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_asset_attachments ON asset_attachments;
        CREATE TRIGGER enforce_tenant_isolation_asset_attachments
            BEFORE INSERT OR UPDATE ON asset_attachments
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Custom reports trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_reports') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_custom_reports ON custom_reports;
        CREATE TRIGGER enforce_tenant_isolation_custom_reports
            BEFORE INSERT OR UPDATE ON custom_reports
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;

    -- Asset custom field values trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_custom_field_values') THEN
        DROP TRIGGER IF EXISTS enforce_tenant_isolation_asset_custom_field_values ON asset_custom_field_values;
        CREATE TRIGGER enforce_tenant_isolation_asset_custom_field_values
            BEFORE INSERT OR UPDATE ON asset_custom_field_values
            FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
    END IF;
END $$;

-- Enhanced RLS policies for strict tenant isolation (only if tenant_id columns exist)

-- Profiles RLS policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;
        CREATE POLICY "profiles_tenant_isolation" ON profiles
            FOR ALL USING (
                tenant_id = get_current_tenant_id() OR
                auth.uid() = id OR
                has_any_role(ARRAY['admin', 'owner'])
            );
    END IF;
END $$;

-- Assets RLS policy enhancement
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assets' AND column_name = 'tenant_id') THEN
        DROP POLICY IF EXISTS "assets_tenant_isolation" ON assets;
        CREATE POLICY "assets_tenant_isolation" ON assets
            FOR ALL USING (
                tenant_id = get_current_tenant_id()
            );
    END IF;
END $$;

-- Function to validate cross-tenant access
CREATE OR REPLACE FUNCTION validate_tenant_access(
    p_tenant_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_tenant_id UUID;
BEGIN
    -- Check if tenant_id column exists in profiles table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        SELECT tenant_id INTO user_tenant_id
        FROM profiles
        WHERE id = p_user_id;
        
        RETURN user_tenant_id = p_tenant_id;
    ELSE
        -- If no tenant_id column, allow access (backward compatibility)
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log tenant isolation violations
CREATE OR REPLACE FUNCTION log_tenant_violation(
    p_attempted_tenant_id UUID,
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_events (
        tenant_id,
        user_id,
        event_type,
        severity,
        description,
        details,
        ip_address,
        created_at
    ) VALUES (
        get_current_tenant_id(),
        p_user_id,
        'suspicious_activity',
        'high',
        'Attempted cross-tenant access violation',
        jsonb_build_object(
            'attempted_tenant_id', p_attempted_tenant_id,
            'resource', p_resource,
            'action', p_action,
            'user_tenant_id', get_current_tenant_id()
        ),
        inet_client_addr(),
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for tenant-isolated user data (only if tenant_id column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        
        -- Drop view if it exists
        DROP VIEW IF EXISTS tenant_users;
        
        -- Create the view
        CREATE VIEW tenant_users AS
        SELECT 
            p.id,
            p.email,
            p.full_name,
            p.avatar_url,
            p.role,
            p.tenant_id,
            p.created_at,
            p.updated_at,
            t.name as tenant_name
        FROM profiles p
        JOIN tenants t ON p.tenant_id = t.id
        WHERE p.tenant_id = get_current_tenant_id();

        -- Grant access to the view
        GRANT SELECT ON tenant_users TO authenticated;
    END IF;
END $$;

-- Add indexes for tenant isolation performance (only if tenant_id columns exist)
DO $$
BEGIN
    -- Profiles indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_tenant_user ON profiles(tenant_id, id);
    END IF;

    -- Assets indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assets' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_assets_tenant_created ON assets(tenant_id, created_at);
    END IF;

    -- API keys indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'api_keys' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_user ON api_keys(tenant_id, user_id);
    END IF;

    -- User sessions indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_sessions' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_user ON user_sessions(tenant_id, user_id);
    END IF;

    -- Security events indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'security_events' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_security_events_tenant_created ON security_events(tenant_id, created_at);
    END IF;

    -- Asset location history indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'asset_location_history' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_asset_location_history_tenant_asset ON asset_location_history(tenant_id, asset_id);
    END IF;

    -- Geofence zones indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'geofence_zones' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_geofence_zones_tenant_name ON geofence_zones(tenant_id, name);
    END IF;

    -- Asset attachments indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'asset_attachments' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_asset_attachments_tenant_asset ON asset_attachments(tenant_id, asset_id);
    END IF;

    -- Custom reports indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'custom_reports' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_custom_reports_tenant_user ON custom_reports(tenant_id, user_id);
    END IF;

    -- Asset custom field values indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'asset_custom_field_values' AND column_name = 'tenant_id') THEN
        CREATE INDEX IF NOT EXISTS idx_asset_custom_field_values_tenant_asset ON asset_custom_field_values(tenant_id, asset_id);
    END IF;
END $$;

-- Add comments
COMMENT ON FUNCTION get_current_tenant_id() IS 'Gets the current tenant ID from context or user profile';
COMMENT ON FUNCTION validate_tenant_access(UUID, UUID) IS 'Validates if user has access to specified tenant';
COMMENT ON FUNCTION log_tenant_violation(UUID, UUID, TEXT, TEXT) IS 'Logs tenant isolation violations for security monitoring';
COMMENT ON VIEW tenant_users IS 'Tenant-isolated view of users with tenant information';