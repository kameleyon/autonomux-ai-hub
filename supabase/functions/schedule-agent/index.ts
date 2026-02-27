import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

const INTERVALS: Record<string, { cron: string; label: string }> = {
  every_15_min: { cron: "*/15 * * * *", label: "Every 15 minutes" },
  every_hour: { cron: "0 * * * *", label: "Hourly" },
  every_6_hours: { cron: "0 */6 * * *", label: "Every 6 hours" },
  every_12_hours: { cron: "0 */12 * * *", label: "Every 12 hours" },
  daily: { cron: "0 9 * * *", label: "Daily" },
  weekly: { cron: "0 9 * * 1", label: "Weekly" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authUser.id;
    const { deployment_id, action, interval } = await req.json();

    if (!deployment_id || !action) {
      return new Response(JSON.stringify({ error: "Missing deployment_id or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidUUID(deployment_id)) {
      return new Response(JSON.stringify({ error: "Invalid deployment_id format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify ownership
    const { data: deployment, error: depErr } = await adminClient
      .from("deployments")
      .select("*")
      .eq("id", deployment_id)
      .single();

    if (depErr || !deployment) {
      return new Response(JSON.stringify({ error: "Deployment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (deployment.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "enable") {
      if (!interval || !INTERVALS[interval]) {
        return new Response(JSON.stringify({ error: "Invalid interval" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cronExpr = INTERVALS[interval].cron;
      if (!/^[\d\s\*\/,-]+$/.test(cronExpr)) {
        return new Response(JSON.stringify({ error: "Invalid cron expression" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sanitizedId = deployment_id.replace(/[^a-f0-9-]/gi, "");
      const jobName = `autonomux_deployment_${sanitizedId}`;

      // Remove existing job if any
      const { data: existingJob } = await adminClient
        .from("scheduled_jobs")
        .select("cron_job_id")
        .eq("deployment_id", deployment_id)
        .single();

      if (existingJob?.cron_job_id) {
        await adminClient.rpc("unschedule_cron_job", { p_job_name: jobName }).catch(() => {});
        await adminClient.from("scheduled_jobs").delete().eq("deployment_id", deployment_id);
      }

      // Schedule the cron job via RPC
      const { data: cronJobId, error: cronErr } = await adminClient.rpc("schedule_cron_job", {
        p_job_name: jobName,
        p_cron_expr: cronExpr,
        p_url: `${supabaseUrl}/functions/v1/run-agent`,
        p_auth_header: serviceRoleKey,
        p_deployment_id: deployment_id,
      });

      if (cronErr) {
        console.error("schedule_cron_job failed:", JSON.stringify(cronErr));
        return new Response(JSON.stringify({ error: "Failed to create schedule" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate next_run_at (approximate)
      const now = new Date();
      let nextRun = new Date(now);
      switch (interval) {
        case "every_15_min": nextRun.setMinutes(nextRun.getMinutes() + 15); break;
        case "every_hour": nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0); break;
        case "every_6_hours": nextRun.setHours(nextRun.getHours() + 6, 0, 0, 0); break;
        case "every_12_hours": nextRun.setHours(nextRun.getHours() + 12, 0, 0, 0); break;
        case "daily": nextRun.setDate(nextRun.getDate() + 1); nextRun.setHours(9, 0, 0, 0); break;
        case "weekly": nextRun.setDate(nextRun.getDate() + (8 - nextRun.getDay()) % 7 || 7); nextRun.setHours(9, 0, 0, 0); break;
      }

      await adminClient
        .from("deployments")
        .update({
          schedule_enabled: true,
          schedule_interval: interval,
          schedule_cron: cronExpr,
          next_run_at: nextRun.toISOString(),
        })
        .eq("id", deployment_id);

      await adminClient.from("scheduled_jobs").upsert({
        deployment_id,
        cron_job_id: cronJobId ?? 0,
      }, { onConflict: "deployment_id" });

      return new Response(
        JSON.stringify({
          success: true,
          schedule: { interval, cron: cronExpr, next_run_at: nextRun.toISOString(), label: INTERVALS[interval].label },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      const sanitizedId = deployment_id.replace(/[^a-f0-9-]/gi, "");
      const jobName = `autonomux_deployment_${sanitizedId}`;

      await adminClient.rpc("unschedule_cron_job", { p_job_name: jobName }).catch(() => {});

      await adminClient
        .from("deployments")
        .update({
          schedule_enabled: false,
          schedule_interval: null,
          schedule_cron: null,
          next_run_at: null,
        })
        .eq("id", deployment_id);

      await adminClient.from("scheduled_jobs").delete().eq("deployment_id", deployment_id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'enable' or 'disable'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
