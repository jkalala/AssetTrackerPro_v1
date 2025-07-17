-- Create table for asset maintenance schedules
CREATE TABLE IF NOT EXISTS public.asset_maintenance_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g. 'inspection', 'service', 'calibration'
  interval TEXT, -- e.g. 'monthly', 'quarterly', 'yearly', or ISO 8601 duration
  next_due DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'overdue')),
  completed_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for maintenance history log
CREATE TABLE IF NOT EXISTS public.asset_maintenance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES public.asset_maintenance_schedules(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  performed_at DATE NOT NULL,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 