-- Verify OAuth configuration and user profiles
-- Run this after setting up OAuth to check everything is working

-- Check if profiles table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if there are any existing user profiles
SELECT 
  id,
  email,
  full_name,
  avatar_url,
  role,
  created_at,
  updated_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Check auth users (this will show users from Supabase auth)
-- Note: This query might not work in all environments due to RLS
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
