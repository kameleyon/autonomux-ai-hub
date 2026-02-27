CREATE OR REPLACE FUNCTION public.get_user_analytics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  run_id UUID,
  agent_name TEXT,
  agent_category TEXT,
  status public.run_status,
  credits_used INTEGER,
  duration_seconds NUMERIC,
  run_date DATE,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    r.id,
    a.name,
    a.category,
    r.status,
    r.credits_used,
    EXTRACT(EPOCH FROM (r.completed_at - r.started_at))::NUMERIC,
    r.created_at::DATE,
    r.created_at
  FROM runs r
  JOIN deployments d ON r.deployment_id = d.id
  JOIN agents a ON d.agent_id = a.id
  WHERE d.user_id = p_user_id
    AND r.created_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY r.created_at DESC
$$;