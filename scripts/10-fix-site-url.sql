-- Fix the site URL configuration in Supabase Auth settings
-- This script provides instructions for manual configuration in Supabase Dashboard

-- IMPORTANT: These settings must be configured in the Supabase Dashboard UI
-- Go to: https://app.supabase.com/project/wyqohljdnrouovuqqdlt/auth/url-configuration

-- 1. Site URL (Main setting):
--    Set to: https://cloudeleavepro.vercel.app

-- 2. Redirect URLs (Add these URLs):
--    - https://cloudeleavepro.vercel.app/auth/callback
--    - https://cloudeleavepro.vercel.app/auth/reset-password
--    - https://cloudeleavepro.vercel.app/**

-- 3. Additional Redirect URLs for development (optional):
--    - http://localhost:3000/auth/callback
--    - http://localhost:3000/auth/reset-password

-- Note: The auth.config table is not directly accessible via SQL
-- All authentication configuration must be done through the Supabase Dashboard

-- You can verify your current authentication settings by checking the dashboard at:
-- Authentication > Settings > URL Configuration

-- After updating these settings, test the signup flow to ensure
-- confirmation emails redirect to the correct production URL
