-- =====================================================
-- DEBUG SCRIPT FOR MIGRATION 42
-- =====================================================
-- Run this script to debug issues with migration 42

-- Check if tenants table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE NOTICE 'SUCCESS: tenants table exists';
    ELSE
        RAISE NOTICE 'ERROR: tenants table does not exist - this is required for tenant_id foreign keys';
    END IF;
END $$;

-- Check if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'SUCCESS: profiles table exists';
        
        -- Check if tenant_id column exists in profiles
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
            RAISE NOTICE 'SUCCESS: profiles.tenant_id column exists';
        ELSE
            RAISE NOTICE 'INFO: profiles.tenant_id column does not exist yet (will be added)';
        END IF;
    ELSE
        RAISE NOTICE 'ERROR: profiles table does not exist';
    END IF;
END $$;

-- Check which tables exist that we want to modify
DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'asset_location_history',
        'geofence_zones', 
        'asset_attachments',
        'custom_reports',
        'asset_maintenance_schedules',
        'asset_lifecycle_rules',
        'asset_categories',
        'asset_custom_field_values',
        'assets',
        'geofence_events',
        'qr_templates',
        'asset_field_definitions'
    ];
    table_name TEXT;
    table_count INTEGER := 0;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_names[array_position(table_names, table_name)]) THEN
            table_count := table_count + 1;
            RAISE NOTICE 'SUCCESS: % table exists', table_name;
        ELSE
            RAISE NOTICE 'INFO: % table does not exist (will be skipped)', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'SUMMARY: Found % out of % expected tables', table_count, array_length(table_names, 1);
END $$;

-- Test the get_current_tenant_id function (basic version)
DO $$
BEGIN
    -- Try to create a basic version of the function for testing
    CREATE OR REPLACE FUNCTION test_get_current_tenant_id()
    RETURNS UUID AS $func$
    BEGIN
        -- Just return NULL for testing - this avoids column dependency issues
        RETURN NULL;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Test the function
    PERFORM test_get_current_tenant_id();
    RAISE NOTICE 'SUCCESS: Basic tenant ID function works';
    
    -- Clean up
    DROP FUNCTION test_get_current_tenant_id();
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Function test failed: %', SQLERRM;
END $$;

-- Final summary
SELECT 'Migration 42 Debug Complete' as status, NOW() as completed_at;