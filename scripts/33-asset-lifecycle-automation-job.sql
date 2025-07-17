-- Function to process asset lifecycle rules and automate status transitions
CREATE OR REPLACE FUNCTION public.process_asset_lifecycle_rules()
RETURNS void AS $$
DECLARE
  r RECORD;
  asset RECORD;
  new_status TEXT;
  trigger_date DATE;
BEGIN
  FOR r IN SELECT * FROM public.asset_lifecycle_rules WHERE status = 'active' AND active LOOP
    IF r.asset_id IS NOT NULL THEN
      SELECT * INTO asset FROM public.assets WHERE id = r.asset_id;
      IF r.trigger_field IS NOT NULL THEN
        IF r.trigger_field = 'purchase_date' THEN
          trigger_date := asset.purchase_date;
        ELSIF r.trigger_field = 'warranty_expiry' THEN
          trigger_date := asset.warranty_expiry;
        END IF;
        IF r.interval IS NOT NULL THEN
          trigger_date := trigger_date + r.interval::interval;
        END IF;
      END IF;
      IF r.trigger_date IS NOT NULL THEN
        trigger_date := r.trigger_date;
      END IF;
      IF trigger_date IS NOT NULL AND trigger_date <= CURRENT_DATE THEN
        -- Determine new status
        IF r.type = 'retire' THEN
          new_status := 'retired';
        ELSIF r.type = 'archive' THEN
          new_status := 'archived';
        ELSIF r.type = 'depreciate' THEN
          new_status := 'depreciated';
        ELSE
          new_status := NULL;
        END IF;
        IF new_status IS NOT NULL THEN
          UPDATE public.assets SET status = new_status, updated_at = NOW() WHERE id = r.asset_id;
          -- Log to asset_history
          INSERT INTO public.asset_history (asset_id, action, old_values, new_values, performed_by, performed_at)
          VALUES (r.asset_id, 'lifecycle_automation', to_jsonb(asset), to_jsonb((SELECT * FROM public.assets WHERE id = r.asset_id)), NULL, NOW());
          -- Mark rule as completed
          UPDATE public.asset_lifecycle_rules SET status = 'completed', active = FALSE, updated_at = NOW() WHERE id = r.id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run daily (using pg_cron or Supabase scheduled tasks)
-- Example for pg_cron:
-- SELECT cron.schedule('0 3 * * *', $$SELECT public.process_asset_lifecycle_rules();$$); 