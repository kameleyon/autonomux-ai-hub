-- Fix agents RLS: policies need to be PERMISSIVE (default), not RESTRICTIVE
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Published agents are viewable by all authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Creators can manage their own agents" ON public.agents;

-- Recreate as permissive (default behavior)
CREATE POLICY "Published agents are viewable by all authenticated users" ON public.agents
  FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY "Creators can manage their own agents" ON public.agents
  FOR ALL TO authenticated USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Also allow anon users to view published agents (for landing page before login)
CREATE POLICY "Published agents are viewable by anonymous users" ON public.agents
  FOR SELECT TO anon USING (is_published = true);