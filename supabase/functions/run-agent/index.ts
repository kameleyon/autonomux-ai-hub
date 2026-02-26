import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getPrompt(category: string, config: Record<string, any>): { system: string; user: string } {
  const configStr = JSON.stringify(config, null, 2);

  switch (category) {
    case "Email Automation":
      return {
        system: "You are an email auto-responder agent. Generate professional email replies based on the user's rules and preferences.",
        user: `Generate a sample email response with these settings:\nTone: ${config.tone || "Professional"}\nLength: ${config.response_length || "Medium"}\nRules: ${config.rules || "Be polite and helpful"}`,
      };
    case "Content Creation":
      return {
        system: "You are a professional blog writer. Create SEO-optimized, engaging blog content.",
        user: `Write a blog post:\nTopic: ${config.topic || "AI Automation"}\nTone: ${config.tone || "Informative"}\nWord count: ${config.word_count || "1000"}\nTarget audience: ${config.target_audience || "General audience"}`,
      };
    case "Data & Analytics":
      return {
        system: "You are a data extraction specialist. Parse and structure information from the provided text.",
        user: `Extract data from the following:\nInput: ${config.input_text || "(no input provided)"}\nOutput format: ${config.output_format || "JSON"}`,
      };
    case "Customer Support":
      return {
        system: "You are a customer support agent. Answer questions helpfully based on the knowledge base provided.",
        user: `Knowledge base: ${config.knowledge_base || "(none)"}\nQuestion: ${config.question || "How can I help?"}`,
      };
    case "Sales":
      return {
        system: "You are a lead research assistant. Generate detailed lead profiles based on criteria.",
        user: `Generate leads:\nIndustry: ${config.industry || "Technology"}\nCompany size: ${config.company_size || "11-50"}\nLocation: ${config.location || "United States"}\nNumber: ${config.num_leads || "10"}`,
      };
    default:
      return {
        system: "You are an AI agent. Complete the requested task based on the configuration provided.",
        user: `Task configuration:\n${configStr}`,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { deployment_id, scheduled } = body;

    if (!deployment_id) {
      return new Response(JSON.stringify({ error: "Missing deployment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string;

    if (scheduled === true) {
      // Scheduled run — called by pg_cron with service role key, skip JWT auth
      // Look up user_id from the deployment
      const { data: dep } = await adminClient
        .from("deployments")
        .select("user_id")
        .eq("id", deployment_id)
        .single();

      if (!dep) {
        return new Response(JSON.stringify({ error: "Deployment not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = dep.user_id;
    } else {
      // Manual run — require JWT auth
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
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub;
    }

    // Fetch deployment with agent
    const { data: deployment, error: depErr } = await adminClient
      .from("deployments")
      .select("*, agents(*)")
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

    if (deployment.status !== "active") {
      return new Response(JSON.stringify({ error: "Deployment is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agent = deployment.agents;
    const creditCost = agent.base_credit_cost;

    // Create run record
    const { data: run, error: runErr } = await adminClient
      .from("runs")
      .insert({
        deployment_id,
        status: "running",
        started_at: new Date().toISOString(),
        input_summary: scheduled ? "[Scheduled run]" : null,
      })
      .select()
      .single();

    if (runErr) {
      return new Response(JSON.stringify({ error: "Failed to create run" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credits
    const { data: profile } = await adminClient
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();

    if (!profile || profile.credits_balance < creditCost) {
      const errMsg = scheduled
        ? "Insufficient credits — schedule paused"
        : "Insufficient credits";

      await adminClient
        .from("runs")
        .update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() })
        .eq("id", run.id);

      // Auto-disable schedule if this was a scheduled run
      if (scheduled) {
        await adminClient
          .from("deployments")
          .update({
            schedule_enabled: false,
            schedule_interval: null,
            schedule_cron: null,
            next_run_at: null,
          })
          .eq("id", deployment_id);

        // Insert notification
        await adminClient.from("notifications").insert({
          user_id: userId,
          type: "error",
          title: "Scheduled run failed — insufficient credits",
          message: `Your scheduled agent "${agent.name}" was paused because you don't have enough credits. You need ${creditCost} credits but have ${profile?.credits_balance ?? 0}. Buy credits to resume.`,
        });
      }

      return new Response(
        JSON.stringify({ error: "Insufficient credits", balance: profile?.credits_balance ?? 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await adminClient
      .from("profiles")
      .update({ credits_balance: profile.credits_balance - creditCost })
      .eq("user_id", userId);

    await adminClient.from("transactions").insert({
      user_id: userId,
      type: "usage",
      credits: -creditCost,
      amount_cents: 0,
    });

    // Build prompt
    const config = (deployment.config as Record<string, any>) ?? {};
    const { system, user: userMsg } = getPrompt(agent.category, config);

    // Call OpenRouter
    try {
      const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ],
          max_tokens: 2000,
        }),
      });

      const llmData = await llmRes.json();

      if (!llmRes.ok || llmData.error) {
        const errMsg = llmData.error?.message || JSON.stringify(llmData.error) || "LLM request failed";

        // Refund credits
        await adminClient
          .from("profiles")
          .update({ credits_balance: profile.credits_balance })
          .eq("user_id", userId);
        await adminClient.from("transactions").insert({
          user_id: userId,
          type: "refund",
          credits: creditCost,
          amount_cents: 0,
        });

        await adminClient
          .from("runs")
          .update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() })
          .eq("id", run.id);

        return new Response(JSON.stringify({ error: errMsg, run }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const outputContent = llmData.choices?.[0]?.message?.content ?? "";
      const outputSummary = outputContent.substring(0, 5000);

      await adminClient
        .from("runs")
        .update({
          status: "success",
          output_summary: outputSummary,
          input_summary: userMsg.substring(0, 500),
          completed_at: new Date().toISOString(),
          credits_used: creditCost,
        })
        .eq("id", run.id);

      // Update last_run_at
      await adminClient
        .from("deployments")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", deployment_id);

      const { data: updatedRun } = await adminClient.from("runs").select("*").eq("id", run.id).single();

      return new Response(JSON.stringify({ run: updatedRun }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (llmErr) {
      // Refund on network error
      await adminClient
        .from("profiles")
        .update({ credits_balance: profile.credits_balance })
        .eq("user_id", userId);
      await adminClient.from("transactions").insert({
        user_id: userId,
        type: "refund",
        credits: creditCost,
        amount_cents: 0,
      });

      await adminClient
        .from("runs")
        .update({ status: "failed", error_message: llmErr.message, completed_at: new Date().toISOString() })
        .eq("id", run.id);

      return new Response(JSON.stringify({ error: llmErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
