-- Add metadata column to tenants table for extra info
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; 