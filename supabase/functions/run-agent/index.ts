import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getPrompt(category: string, slug: string, config: Record<string, any>): { system: string; user: string } {
  const configStr = JSON.stringify(config, null, 2);

  if (category === "Email" || category === "Email Automation" || slug === "email-auto-responder") {
    return {
      system: "You are a professional email assistant. Read the incoming email and draft a reply that matches the specified tone and rules. Output ONLY the reply body — no subject line, no explanations, no 'Here\u2019s a draft' preamble. Write it exactly as it should be sent.",
      user: `Tone: ${config.tone || "Professional"}\nResponse length: ${config.response_length || "Medium (1 paragraph)"}\nMy rules: ${config.rules || "Be polite, address all points raised, sign off with best regards"}\n---\nIncoming email to reply to:\n${config.email_content || "(no email provided)"}\n---\nDraft a reply to this email.`,
    };
  }

  if (category === "Content" || category === "Content Creation") {
    if (slug === "meeting-summarizer") {
      return {
        system: "You are a meeting notes specialist. Analyze the transcript and produce a structured summary.",
        user: `Meeting transcript:\n${config.transcript || "(none)"}\nOutput type: ${config.output_type || "All"}\n\nProvide:\n1. Executive Summary\n2. Key Discussion Points\n3. Decisions Made\n4. Action Items\n5. Follow-up Items`,
      };
    }
    return {
      system: "You are a professional blog writer. Create SEO-optimized, engaging blog content.",
      user: `Write a blog post:\nTopic: ${config.topic || "AI Automation"}\nTone: ${config.tone || "Informative"}\nWord count: ${config.word_count || "1000"}\nTarget audience: ${config.target_audience || "General audience"}`,
    };
  }

  if (category === "Data" || category === "Data & Analytics") {
    if (slug === "invoice-processor") {
      return {
        system: "You are an accounts payable specialist. Extract invoice data accurately.",
        user: `Invoice text:\n${config.input_text || "(none)"}\nFields: ${config.fields_to_extract || "all"}\nFormat: ${config.output_format || "JSON"}`,
      };
    }
    return {
      system: "You are a data extraction specialist. Parse and structure information from the provided text.",
      user: `Extract data from:\nInput: ${config.input_text || "(no input)"}\nFormat: ${config.output_format || "JSON"}`,
    };
  }

  if (category === "Support" || category === "Customer Support") {
    return {
      system: "You are a customer support agent. Answer questions helpfully based on the knowledge base provided.",
      user: `Knowledge base: ${config.knowledge_base || "(none)"}\nQuestion: ${config.question || "How can I help?"}`,
    };
  }

  if (category === "Sales") {
    return {
      system: "You are a lead research assistant. Generate detailed lead profiles based on criteria.",
      user: `Generate leads:\nIndustry: ${config.industry || "Technology"}\nCompany size: ${config.company_size || "11-50"}\nLocation: ${config.location || "United States"}\nNumber: ${config.num_leads || "10"}`,
    };
  }

  if (category === "Marketing") {
    return {
      system: "You are a competitive intelligence analyst. Analyze competitors and provide actionable insights.",
      user: `Competitor: ${config.competitor_url || "(none)"}\nFocus: ${config.focus_areas || "All"}\nIndustry: ${config.industry || "Technology"}\n\nProvide overview, recent changes, strengths/weaknesses, and recommended actions.`,
    };
  }

  if (category === "Social Media") {
    return {
      system: "You are a social media content strategist. Create engaging, platform-appropriate posts.",
      user: `Create ${config.num_posts || "5"} posts about: ${config.topic || "AI"}\nPlatform: ${config.platforms || "All"}\nTone: ${config.tone || "Professional"}\n\nInclude hashtags and posting suggestions.`,
    };
  }

  if (category === "Development") {
    return {
      system: "You are a senior software engineer performing a code review.",
      user: `Language: ${config.language || "TypeScript"}\nFocus: ${config.focus || "All"}\n\nCode:\n\`\`\`\n${config.code || "(no code)"}\n\`\`\`\n\nProvide: quality score, issues, suggestions, and improved code.`,
    };
  }

  // Default fallback
  return {
    system: "You are an AI agent. Complete the requested task based on the configuration provided.",
    user: `Task configuration:\n${configStr}`,
  };
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
      userId = authUser.id;
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

    // Rate limit: max 10 runs per minute per deployment
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentRunCount } = await adminClient
      .from("runs")
      .select("id", { count: "exact", head: true })
      .eq("deployment_id", deployment_id)
      .gte("created_at", oneMinuteAgo);

    if ((recentRunCount ?? 0) >= 10) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Max 10 runs per minute per agent." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Atomic credit deduction
    const { data: newBalance, error: deductErr } = await adminClient.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: creditCost,
    });

    if (deductErr || newBalance === -1 || newBalance === null) {
      const errMsg = scheduled
        ? "Insufficient credits — schedule paused"
        : "Insufficient credits";

      await adminClient
        .from("runs")
        .update({ status: "failed", error_message: errMsg, completed_at: new Date().toISOString() })
        .eq("id", run.id);

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

        await adminClient.from("notifications").insert({
          user_id: userId,
          type: "error",
          title: "Scheduled run failed — insufficient credits",
          message: `Your scheduled agent "${agent.name}" was paused because you don't have enough credits. You need ${creditCost} credits but have 0. Buy credits to resume.`,
        });
      }

      return new Response(
        JSON.stringify({ error: "Insufficient credits", balance: 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transaction log
    await adminClient.from("transactions").insert({
      user_id: userId,
      type: "usage",
      credits: -creditCost,
      amount_cents: 0,
    });

    // Build prompt
    const config = (deployment.config as Record<string, any>) ?? {};
    const { system, user: userMsg } = getPrompt(agent.category, agent.slug, config);

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

        await adminClient.rpc("refund_credits", { p_user_id: userId, p_amount: creditCost });
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
      await adminClient.rpc("refund_credits", { p_user_id: userId, p_amount: creditCost });
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
