-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    max_users INTEGER NOT NULL DEFAULT 5,
    max_assets INTEGER NOT NULL DEFAULT 100,
    features JSONB NOT NULL DEFAULT '{
        "qrCodes": true,
        "analytics": false,
        "api": false,
        "customBranding": false,
        "multipleLocations": false,
        "advancedReports": false
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add tenant_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Create billing table
CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    invoice_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies for tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are viewable by users within the tenant"
    ON tenants FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE tenant_id = tenants.id
    ));

CREATE POLICY "Tenants are editable by tenant owners and super admins"
    ON tenants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND tenant_id = tenants.id
            AND (is_owner = true OR role = 'super_admin')
        )
    );

-- Create RLS policies for billing
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing is viewable by tenant owners and admins"
    ON billing FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND tenant_id = billing.tenant_id
            AND (is_owner = true OR role IN ('admin', 'super_admin'))
        )
    );

-- Create RLS policies for billing_history
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing history is viewable by tenant owners and admins"
    ON billing_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND tenant_id = billing_history.tenant_id
            AND (is_owner = true OR role IN ('admin', 'super_admin'))
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_tenant_id ON billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_tenant_id ON billing_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_stripe_customer ON billing(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_stripe_subscription ON billing(stripe_subscription_id);

-- Update existing profiles to have a default tenant
-- This is a migration step for existing data
DO $$
BEGIN
    -- Create a default tenant for existing users without a tenant
    INSERT INTO tenants (name, plan, status)
    SELECT DISTINCT 'Default Tenant', 'basic', 'active'
    FROM profiles
    WHERE tenant_id IS NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE tenant_id IS NULL)
    LIMIT 1;

    -- Update existing profiles to use the default tenant
    WITH default_tenant AS (
        SELECT id FROM tenants LIMIT 1
    )
    UPDATE profiles
    SET tenant_id = (SELECT id FROM default_tenant)
    WHERE tenant_id IS NULL;
END $$; 