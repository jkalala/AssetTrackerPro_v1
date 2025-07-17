-- Create reminders table if not exists
CREATE TABLE IF NOT EXISTS public.maintenance_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.asset_maintenance_schedules(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to check for due/overdue maintenance and insert reminders
CREATE OR REPLACE FUNCTION public.check_due_maintenance()
RETURNS void AS $$
BEGIN
  INSERT INTO public.maintenance_reminders (asset_id, schedule_id, due_date)
  SELECT asset_id, id, next_due
  FROM public.asset_maintenance_schedules
  WHERE next_due <= CURRENT_DATE
    AND status = 'scheduled'
    AND NOT EXISTS (
      SELECT 1 FROM public.maintenance_reminders r
      WHERE r.schedule_id = asset_maintenance_schedules.id
        AND r.due_date = asset_maintenance_schedules.next_due
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run daily (using pg_cron or Supabase scheduled tasks)
-- Example for pg_cron:
-- SELECT cron.schedule('0 2 * * *', $$SELECT public.check_due_maintenance();$$); 