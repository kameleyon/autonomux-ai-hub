
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_on_run_complete BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_run_failed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_schedule_fail BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deployment_id UUID NOT NULL REFERENCES public.deployments(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  action_description TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours',
  responded_at TIMESTAMPTZ
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own approval requests" ON public.approval_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own approval requests" ON public.approval_requests FOR UPDATE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;
