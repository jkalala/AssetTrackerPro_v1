-- Configure authentication settings for AssetTracker Pro
-- NOTE: This script provides SQL operations that CAN be performed
-- Auth settings must be configured through the Supabase Dashboard

-- Create a table to store our application configuration
-- This can be used to track what settings have been applied
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert our recommended auth configuration as reference
INSERT INTO public.app_config (key, value, description)
VALUES 
    ('auth_settings', 
    '{
        "site_url": "https://cloudeleavepro.vercel.app",
        "redirect_urls": [
            "https://cloudeleavepro.vercel.app/auth/callback",
            "https://cloudeleavepro.vercel.app/dashboard",
            "https://cloudeleavepro.vercel.app/",
            "http://localhost:3000/auth/callback",
            "http://localhost:3000/dashboard",
            "http://localhost:3000/"
        ],
        "disable_signup": false,
        "email_confirmations_enabled": true,
        "github_enabled": true,
        "github_client_id": "Ov23lipMb8831rUNvsJR"
    }',
    'Recommended auth settings - apply these in Supabase dashboard')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add audit log retention period to app_config
INSERT INTO public.app_config (key, value, description)
VALUES (
  'audit_log_retention_days',
  '365',
  'Number of days to retain audit logs before deletion'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add asset history retention period to app_config
INSERT INTO public.app_config (key, value, description)
VALUES (
  'asset_history_retention_days',
  '365',
  'Number of days to retain asset history before deletion'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Create a function to check if GitHub OAuth is configured in our app
CREATE OR REPLACE FUNCTION check_github_oauth_config()
RETURNS TABLE (
    status TEXT,
    message TEXT,
    recommendation TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    config_exists BOOLEAN;
    github_enabled BOOLEAN;
BEGIN
    -- Check if we have auth config
    SELECT EXISTS(
        SELECT 1 FROM public.app_config 
        WHERE key = 'auth_settings'
    ) INTO config_exists;
    
    -- Check if GitHub is enabled in our config
    IF config_exists THEN
        SELECT (value->>'github_enabled')::BOOLEAN 
        FROM public.app_config 
        WHERE key = 'auth_settings'
        INTO github_enabled;
    ELSE
        github_enabled := FALSE;
    END IF;
    
    -- Return status
    IF config_exists AND github_enabled THEN
        RETURN QUERY SELECT 
            'CONFIG_FOUND'::TEXT, 
            'GitHub OAuth configuration found in app_config'::TEXT,
            'Verify settings are applied in Supabase dashboard'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            'CONFIG_MISSING'::TEXT, 
            'GitHub OAuth not configured in app_config'::TEXT,
            'Run the configuration script and apply settings in dashboard'::TEXT;
    END IF;
END;
$$;

-- Display our recommended auth configuration
SELECT 
    'RECOMMENDED AUTH SETTINGS' as section,
    key,
    value->>'site_url' as site_url,
    value->>'disable_signup' as disable_signup,
    value->>'email_confirmations_enabled' as email_confirmations_enabled,
    value->>'github_enabled' as github_enabled,
    value->>'github_client_id' as github_client_id,
    updated_at
FROM public.app_config
WHERE key = 'auth_settings';

-- Show redirect URLs separately for better readability
SELECT 
    'REDIRECT URLS' as section,
    jsonb_array_elements_text(value->'redirect_urls') as redirect_url
FROM public.app_config
WHERE key = 'auth_settings';

-- Check GitHub OAuth configuration
SELECT * FROM check_github_oauth_config();
