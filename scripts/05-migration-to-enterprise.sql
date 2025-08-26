-- =====================================================
-- MIGRATION TO ENTERPRISE SCHEMA
-- =====================================================
-- This script safely migrates existing data to the new enterprise schema
-- while preserving all existing functionality and data integrity.

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS backup_profiles AS SELECT * FROM public.profiles;
CREATE TABLE IF NOT EXISTS backup_assets AS SELECT * FROM public.assets;
CREATE TABLE IF NOT EXISTS backup_asset_history AS SELECT * FROM public.asset_history;

-- =====================================================
-- CREATE DEFAULT TENANT FOR EXISTING DATA
-- =====================================================

-- Insert default tenant for existing data
INSERT INTO public.tenants (
    id,
    name,
    slug,
    status,
    plan,
    settings,
    branding,
    created_at
) VALUES (
    gen_random_uuid(),
    'Default Organization',
    'default-org',
    'active',
    'professional',
    '{"initialized": true, "migration_date": "' || NOW()::TEXT || '"}',
    '{"companyName": "AssetTracker Pro", "primaryColor": "#2563eb"}',
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Get the default tenant ID
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-org';
    
    -- Store in session for use in migration
    PERFORM set_config('migration.default_tenant_id', default_tenant_id::TEXT, true);
    
    RAISE NOTICE 'Default tenant created with ID: %', default_tenant_id;
END $$;

-- =====================================================
-- MIGRATE EXISTING PROFILES
-- =====================================================

-- Update existing profiles to include tenant association
UPDATE public.profiles SET 
    tenant_id = current_setting('migration.default_tenant_id')::UUID,
    is_owner = CASE WHEN role = 'admin' THEN TRUE ELSE FALSE END,
    role = CASE 
        WHEN role = 'admin' THEN 'owner'
        ELSE role
    END,
    preferences = '{}',
    timezone = 'UTC',
    language = 'en'
WHERE tenant_id IS NULL;

-- =====================================================
-- MIGRATE EXISTING ASSETS
-- =====================================================

-- Create default asset category if none exist
INSERT INTO public.asset_categories (
    tenant_id,
    name,
    description,
    icon
) VALUES (
    current_setting('migration.default_tenant_id')::UUID,
    'General',
    'General asset category for migrated assets',
    'package'
) ON CONFLICT DO NOTHING;

-- Get default category ID
DO $$
DECLARE
    default_category_id UUID;
    default_tenant_id UUID;
BEGIN
    default_tenant_id := current_setting('migration.default_tenant_id')::UUID;
    
    SELECT id INTO default_category_id 
    FROM public.asset_categories 
    WHERE tenant_id = default_tenant_id AND name = 'General';
    
    PERFORM set_config('migration.default_category_id', default_category_id::TEXT, true);
    
    RAISE NOTICE 'Default category created with ID: %', default_category_id;
END $$;

-- Update existing assets with tenant and category information
UPDATE public.assets SET 
    tenant_id = current_setting('migration.default_tenant_id')::UUID,
    category_id = current_setting('migration.default_category_id')::UUID,
    status = CASE 
        WHEN status = 'active' THEN 'active'::asset_status
        WHEN status = 'maintenance' THEN 'maintenance'::asset_status
        WHEN status = 'retired' THEN 'retired'::asset_status
        ELSE 'active'::asset_status
    END,
    tags = '{}',
    specifications = '{}',
    custom_fields = '{}',
    attachments = '[]',
    certifications = '[]',
    depreciation_method = 'straight_line'::depreciation_method
WHERE tenant_id IS NULL;

-- =====================================================
-- MIGRATE EXISTING ASSET HISTORY
-- =====================================================

-- Update existing asset history with tenant information
UPDATE public.asset_history SET 
    tenant_id = current_setting('migration.default_tenant_id')::UUID,
    action = CASE 
        WHEN action = 'created' THEN 'create'::audit_action
        WHEN action = 'updated' THEN 'update'::audit_action
        WHEN action = 'deleted' THEN 'delete'::audit_action
        ELSE 'update'::audit_action
    END,
    change_summary = 'Migrated from legacy system'
WHERE tenant_id IS NULL;

-- =====================================================
-- CREATE SAMPLE DATA FOR DEMONSTRATION
-- =====================================================

-- Create sample IoT device for demonstration
INSERT INTO public.iot_devices (
    tenant_id,
    asset_id,
    device_id,
    device_name,
    device_type,
    protocol,
    status,
    configuration
) 
SELECT 
    current_setting('migration.default_tenant_id')::UUID,
    a.id,
    'DEMO-' || SUBSTRING(a.asset_id FROM 1 FOR 8),
    'Demo GPS Tracker for ' || a.name,
    'gps_tracker'::iot_device_type,
    'mqtt'::iot_protocol,
    'active'::device_status,
    '{"demo": true, "sample_interval": 300}'::JSONB
FROM public.assets a 
WHERE a.tenant_id = current_setting('migration.default_tenant_id')::UUID
LIMIT 3;

-- Create sample geofence for demonstration
INSERT INTO public.geofences (
    tenant_id,
    name,
    description,
    geometry,
    rules,
    created_by
)
SELECT 
    current_setting('migration.default_tenant_id')::UUID,
    'Main Office Area',
    'Primary office building and parking area',
    ST_GeomFromText('POLYGON((-122.4194 37.7749, -122.4094 37.7749, -122.4094 37.7849, -122.4194 37.7849, -122.4194 37.7749))', 4326),
    '{"business_hours": {"start": "08:00", "end": "18:00"}, "alert_after_hours": true}'::JSONB,
    p.id
FROM public.profiles p 
WHERE p.tenant_id = current_setting('migration.default_tenant_id')::UUID 
AND p.is_owner = TRUE
LIMIT 1;

-- =====================================================
-- UPDATE SEQUENCES AND CONSTRAINTS
-- =====================================================

-- Update any sequences that might be affected
SELECT setval(pg_get_serial_sequence('public.tenants', 'id'), COALESCE(MAX(id::TEXT)::BIGINT, 1)) FROM public.tenants;

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================

-- Verification queries
DO $$
DECLARE
    tenant_count INTEGER;
    profile_count INTEGER;
    asset_count INTEGER;
    history_count INTEGER;
    orphaned_profiles INTEGER;
    orphaned_assets INTEGER;
BEGIN
    -- Count migrated records
    SELECT COUNT(*) INTO tenant_count FROM public.tenants;
    SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE tenant_id IS NOT NULL;
    SELECT COUNT(*) INTO asset_count FROM public.assets WHERE tenant_id IS NOT NULL;
    SELECT COUNT(*) INTO history_count FROM public.asset_history WHERE tenant_id IS NOT NULL;
    
    -- Check for orphaned records
    SELECT COUNT(*) INTO orphaned_profiles FROM public.profiles WHERE tenant_id IS NULL;
    SELECT COUNT(*) INTO orphaned_assets FROM public.assets WHERE tenant_id IS NULL;
    
    -- Report results
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Tenants created: %', tenant_count;
    RAISE NOTICE 'Profiles migrated: %', profile_count;
    RAISE NOTICE 'Assets migrated: %', asset_count;
    RAISE NOTICE 'History records migrated: %', history_count;
    RAISE NOTICE 'Orphaned profiles: %', orphaned_profiles;
    RAISE NOTICE 'Orphaned assets: %', orphaned_assets;
    
    IF orphaned_profiles > 0 OR orphaned_assets > 0 THEN
        RAISE WARNING 'Some records were not migrated. Please review orphaned data.';
    ELSE
        RAISE NOTICE 'Migration completed successfully! All records have been migrated.';
    END IF;
END $$;

-- =====================================================
-- CLEANUP MIGRATION SETTINGS
-- =====================================================

-- Clear migration settings
PERFORM set_config('migration.default_tenant_id', '', true);
PERFORM set_config('migration.default_category_id', '', true);

-- =====================================================
-- POST-MIGRATION RECOMMENDATIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== POST-MIGRATION RECOMMENDATIONS ===';
    RAISE NOTICE '1. Review and update tenant settings in the tenants table';
    RAISE NOTICE '2. Configure proper branding and feature flags for your organization';
    RAISE NOTICE '3. Set up additional asset categories as needed';
    RAISE NOTICE '4. Configure IoT devices and geofences for your specific use case';
    RAISE NOTICE '5. Test the application with the new schema';
    RAISE NOTICE '6. Update application code to use tenant context';
    RAISE NOTICE '7. Consider removing backup tables after verification: backup_profiles, backup_assets, backup_asset_history';
END $$;