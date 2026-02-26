
-- Add schedule columns to deployments
ALTER TABLE public.deployments
ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS schedule_interval TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS schedule_cron TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ DEFAULT NULL;

-- Create scheduled_jobs table
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL UNIQUE REFERENCES public.deployments(id) ON DELETE CASCADE,
  cron_job_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own scheduled jobs" ON public.scheduled_jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.deployments d WHERE d.id = deployment_id AND d.user_id = auth.uid())
  );
