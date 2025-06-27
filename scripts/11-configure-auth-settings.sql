-- Configure authentication settings for AssetTracker Pro
-- This script helps set up proper auth configuration

-- First, let's check current auth settings
SELECT 
    setting_name,
    setting_value
FROM auth.config 
WHERE setting_name IN (
    'SITE_URL',
    'URI_ALLOW_LIST',
    'DISABLE_SIGNUP',
    'EXTERNAL_EMAIL_ENABLED',
    'EXTERNAL_GITHUB_ENABLED'
);

-- Update site URL if needed
-- Note: This should match your production URL
UPDATE auth.config 
SET setting_value = 'https://cloudeleavepro.vercel.app'
WHERE setting_name = 'SITE_URL';

-- Configure allowed redirect URLs
-- Note: This should include all your valid redirect URLs
UPDATE auth.config 
SET setting_value = 'https://cloudeleavepro.vercel.app/auth/callback,https://cloudeleavepro.vercel.app/dashboard,https://cloudeleavepro.vercel.app/,http://localhost:3000/auth/callback,http://localhost:3000/dashboard,http://localhost:3000/'
WHERE setting_name = 'URI_ALLOW_LIST';

-- Ensure signup is enabled
UPDATE auth.config 
SET setting_value = 'false'
WHERE setting_name = 'DISABLE_SIGNUP';

-- Enable email confirmations (this is typically done via dashboard)
-- The following are informational - actual email settings are configured via Supabase dashboard

-- Email confirmation settings (configured via dashboard):
-- - MAILER_AUTOCONFIRM: false (require email confirmation)
-- - MAILER_SECURE_EMAIL_CHANGE_ENABLED: true
-- - EXTERNAL_EMAIL_ENABLED: true

-- GitHub OAuth settings (configured via dashboard):
-- - EXTERNAL_GITHUB_ENABLED: true
-- - EXTERNAL_GITHUB_CLIENT_ID: Ov23lipMb8831rUNvsJR
-- - EXTERNAL_GITHUB_SECRET: 97c8805c06fa9b6589b8d33848a0835873fd2f98
-- - EXTERNAL_GITHUB_REDIRECT_URI: https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1/callback

-- Verify the configuration
SELECT 
    'Configuration Updated' as status,
    setting_name,
    setting_value
FROM auth.config 
WHERE setting_name IN (
    'SITE_URL',
    'URI_ALLOW_LIST',
    'DISABLE_SIGNUP'
)
ORDER BY setting_name;

-- Create a function to help debug auth issues
CREATE OR REPLACE FUNCTION debug_auth_config()
RETURNS TABLE (
    setting_name text,
    setting_value text,
    description text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.setting_name::text,
        ac.setting_value::text,
        CASE ac.setting_name
            WHEN 'SITE_URL' THEN 'Main site URL for redirects'
            WHEN 'URI_ALLOW_LIST' THEN 'Allowed redirect URLs'
            WHEN 'DISABLE_SIGNUP' THEN 'Whether signup is disabled'
            WHEN 'EXTERNAL_EMAIL_ENABLED' THEN 'Email auth enabled'
            WHEN 'EXTERNAL_GITHUB_ENABLED' THEN 'GitHub OAuth enabled'
            ELSE 'Other setting'
        END::text as description
    FROM auth.config ac
    WHERE ac.setting_name IN (
        'SITE_URL',
        'URI_ALLOW_LIST', 
        'DISABLE_SIGNUP',
        'EXTERNAL_EMAIL_ENABLED',
        'EXTERNAL_GITHUB_ENABLED'
    )
    ORDER BY ac.setting_name;
END;
$$;

-- Usage: SELECT * FROM debug_auth_config();
