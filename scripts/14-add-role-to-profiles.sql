-- Add role field to profiles table for RBAC
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
-- Optionally, create an index for fast role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role); 