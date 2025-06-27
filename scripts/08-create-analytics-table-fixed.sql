-- Create analytics_events table for real-time tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('asset_created', 'asset_updated', 'asset_scanned', 'user_login', 'qr_generated')),
    asset_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_asset_id ON analytics_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically track asset events
CREATE OR REPLACE FUNCTION track_asset_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Track asset creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO analytics_events (event_type, asset_id, user_id, metadata)
        VALUES ('asset_created', NEW.asset_id, NEW.created_by, jsonb_build_object('asset_name', NEW.name, 'category', NEW.category));
        RETURN NEW;
    END IF;
    
    -- Track asset updates
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO analytics_events (event_type, asset_id, user_id, metadata)
        VALUES ('asset_updated', NEW.asset_id, auth.uid(), jsonb_build_object('asset_name', NEW.name, 'category', NEW.category, 'changes', jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))));
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic event tracking
DROP TRIGGER IF EXISTS track_asset_events ON assets;
CREATE TRIGGER track_asset_events
    AFTER INSERT OR UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION track_asset_event();

-- Create function to track QR code generation
CREATE OR REPLACE FUNCTION track_qr_generation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track when QR code is added (not when it's removed)
    IF TG_OP = 'UPDATE' AND OLD.qr_code IS NULL AND NEW.qr_code IS NOT NULL THEN
        INSERT INTO analytics_events (event_type, asset_id, user_id, metadata)
        VALUES ('qr_generated', NEW.asset_id, auth.uid(), jsonb_build_object('asset_name', NEW.name));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for QR generation tracking
DROP TRIGGER IF EXISTS track_qr_generation ON assets;
CREATE TRIGGER track_qr_generation
    AFTER UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION track_qr_generation();

-- Create function to track user logins
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO analytics_events (event_type, user_id, metadata)
    VALUES ('user_login', NEW.id, jsonb_build_object('login_time', NOW()));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions (fixed to remove non-existent sequence)
GRANT SELECT, INSERT ON analytics_events TO authenticated;

-- Create view for analytics summary
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT asset_id) as unique_assets,
    COUNT(DISTINCT user_id) as unique_users,
    DATE_TRUNC('day', created_at) as event_date
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event_type;

-- Grant access to the view
GRANT SELECT ON analytics_summary TO authenticated;
