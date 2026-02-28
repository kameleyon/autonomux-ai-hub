
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to schedule a cron job for a deployment
CREATE OR REPLACE FUNCTION public.schedule_cron_job(
  p_job_name TEXT,
  p_cron_expr TEXT,
  p_url TEXT,
  p_auth_header TEXT,
  p_deployment_id TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job_id BIGINT;
BEGIN
  -- Validate job name (only alphanumeric, underscore, dash)
  IF p_job_name !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid job name';
  END IF;
  
  -- Validate cron expression (only digits, spaces, asterisks, slashes, commas, dashes)
  IF p_cron_expr !~ '^[\d\s\*\/,-]+$' THEN
    RAISE EXCEPTION 'Invalid cron expression';
  END IF;

  SELECT cron.schedule(
    p_job_name,
    p_cron_expr,
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb) AS request_id',
      p_url,
      json_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || p_auth_header)::text,
      json_build_object('deployment_id', p_deployment_id, 'scheduled', true)::text
    )
  ) INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- Function to unschedule a cron job
CREATE OR REPLACE FUNCTION public.unschedule_cron_job(p_job_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_job_name !~ '^[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid job name';
  END IF;
  
  PERFORM cron.unschedule(p_job_name);
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;
