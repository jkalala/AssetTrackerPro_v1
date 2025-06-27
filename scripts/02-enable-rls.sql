-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Assets policies
CREATE POLICY "Users can view all assets" ON public.assets
  FOR SELECT USING (true);

CREATE POLICY "Users can create assets" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update assets they created or are assigned to" ON public.assets
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assignee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Asset history policies
CREATE POLICY "Users can view asset history" ON public.asset_history
  FOR SELECT USING (true);

CREATE POLICY "Users can create asset history" ON public.asset_history
  FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
    ) OR created_by = auth.uid()
  );

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Team members policies
CREATE POLICY "Users can view team members of teams they belong to" ON public.team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm 
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );
