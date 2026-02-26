import { Json } from "@/integrations/supabase/types";

export type DeploymentWithAgent = {
  id: string;
  user_id: string;
  agent_id: string;
  config: Json | null;
  status: string;
  schedule_enabled: boolean | null;
  schedule_interval: string | null;
  schedule_cron: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  agents: { name: string; base_credit_cost: number } | null;
};
