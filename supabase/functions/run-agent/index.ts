import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function trackError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Autonomux Error]${context ? ` [${context}]` : ""}: ${message}`);
}

async function webSearch(query: string, count = 5): Promise<Array<{ title: string; url: string; description: string }>> {
  try {
    const braveKey = Deno.env.get("BRAVE_SEARCH_API_KEY");
    if (!braveKey) return [];

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "X-Subscription-Token": braveKey },
    });
    if (!res.ok) { await res.text(); return []; }
    const data = await res.json();
    return (data.web?.results ?? []).map((r: any) => ({
      title: r.title, url: r.url, description: r.description,
    }));
  } catch (e) { trackError(e, "webSearch"); return []; }
}

function formatSearchResults(results: Array<{ title: string; url: string; description: string }>): string {
  if (results.length === 0) return "(No search results available)";
  return results.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.description}`).join("\n\n");
}

async function getPrompt(category: string, slug: string, config: Record<string, any>): Promise<{ system: string; user: string }> {
  const configStr = JSON.stringify(config, null, 2);

  // Email Automation
  if (category === "Email" || category === "Email Automation" || slug === "email-auto-responder") {
    return {
      system: "You are a professional email assistant. Read the incoming email and draft a reply that matches the specified tone and rules. Output ONLY the reply body \u2014 no subject line, no explanations, no \u2018Here\u2019s a draft\u2019 preamble. Write it exactly as it should be sent.",
      user: `Tone: ${config.tone || "Professional"}\nResponse length: ${config.response_length || "Medium (1 paragraph)"}\nMy rules: ${config.rules || "Be polite, address all points raised, sign off with best regards"}\n---\nIncoming email to reply to:\n${config.email_content || "(no email provided)"}\n---\nDraft a reply to this email.`,
    };
  }

  // Content Creation
  if (category === "Content" || category === "Content Creation") {
    if (slug === "meeting-summarizer") {
      return {
        system: "You are a meeting notes specialist. Analyze the provided transcript and produce a structured summary. Use clear sections with headers. Be concise but don't miss key points.",
        user: `Meeting transcript:\n---\n${config.transcript || "(none)"}\n---\nOutput type: ${config.output_type || "All"}\n\nProvide:\n1. Executive Summary (2-3 sentences)\n2. Key Discussion Points (bullet list)\n3. Decisions Made\n4. Action Items (with assignees if mentioned)\n5. Follow-up Items / Open Questions`,
      };
    }
    return {
      system: "You are an expert SEO content writer. Write engaging, well-structured blog posts with proper headings (H2, H3), bullet points, and actionable insights. Include a compelling introduction and a clear conclusion with a call-to-action. Use markdown formatting. Target the specified word count closely.",
      user: `Write a blog post about: ${config.topic || "AI Automation"}\nTone: ${config.tone || "Informative"}\nTarget word count: ${config.word_count || "1000"}\nTarget audience: ${config.target_audience || "General audience"}\n\nRequirements:\n- SEO-optimized with relevant keywords naturally integrated\n- Include at least 3 subheadings\n- Add specific examples or data points where relevant\n- End with a call-to-action`,
    };
  }

  // Sales — Lead Scraper (with web search)
  if (category === "Sales") {
    const query = `${config.industry || "Technology"} companies ${config.location || "United States"} ${config.company_size || "11-50"} employees`;
    const searchResults = await webSearch(query);
    const searchContext = formatSearchResults(searchResults);
    return {
      system: "You are a B2B lead research specialist. Using the search results provided and your knowledge, generate detailed lead profiles for companies matching the criteria. Each lead should include: Company Name, Website, Estimated Size, Industry, Key Contact Roles to Target, and a Personalized Outreach Angle.",
      user: `Search results for context:\n${searchContext}\n\nCriteria:\nIndustry: ${config.industry || "Technology"}\nCompany size: ${config.company_size || "11-50"}\nLocation: ${config.location || "United States"}\n\nGenerate ${config.num_leads || "10"} lead profiles.`,
    };
  }

  // Marketing — Competitor Monitor (with web search)
  if (category === "Marketing") {
    const query = `${config.competitor_url || ""} ${config.focus_areas || ""} latest news updates`;
    const searchResults = await webSearch(query);
    const searchContext = formatSearchResults(searchResults);
    return {
      system: "You are a competitive intelligence analyst. Analyze the search results and available information about the specified competitor. Provide actionable insights organized by focus area.",
      user: `Search results:\n${searchContext}\n\nCompetitor: ${config.competitor_url || "(none)"}\nFocus: ${config.focus_areas || "All"}\nIndustry: ${config.industry || "Technology"}\n\nAnalyze this competitor and provide:\n1. Overview & Positioning\n2. Recent Changes/Updates\n3. Strengths & Weaknesses\n4. Opportunities for Differentiation\n5. Recommended Actions`,
    };
  }

  // Customer Support
  if (category === "Support" || category === "Customer Support") {
    return {
      system: "You are a helpful customer support agent. Answer questions ONLY based on the knowledge base provided. If the answer isn't in the knowledge base, say so honestly. Be friendly, clear, and concise. If the question requires escalation, suggest it.",
      user: `Knowledge base:\n---\n${config.knowledge_base || "(none)"}\n---\n\nCustomer question: ${config.question || "How can I help?"}\n\nProvide a helpful answer based on the knowledge base above.`,
    };
  }

  // Social Media
  if (category === "Social Media") {
    return {
      system: "You are a social media content strategist. Create engaging, platform-appropriate posts that drive engagement. Each post should include hashtags, emojis where appropriate, and a clear call-to-action. Tailor content to each platform's best practices and character limits.",
      user: `Create ${config.num_posts || "5"} social media posts about: ${config.topic || "AI"}\nPlatform(s): ${config.platforms || "All"}\nTone: ${config.tone || "Professional"}\n\nFor each post provide:\n1. The post content (platform-ready)\n2. Suggested posting time\n3. 3-5 relevant hashtags\n4. Expected engagement type (likes, shares, comments)`,
    };
  }

  // Development — Code Reviewer
  if (category === "Development") {
    return {
      system: "You are a senior software engineer performing a code review. Analyze the code for the specified focus areas. Be constructive, specific, and provide code examples for fixes. Rate the overall quality on a scale of 1-10.",
      user: `Language: ${config.language || "TypeScript"}\nFocus areas: ${config.focus || "All"}\n\nCode to review:\n\`\`\`\n${config.code || "(no code)"}\n\`\`\`\n\nProvide:\n1. Overall Quality Score (X/10)\n2. Critical Issues (must fix)\n3. Warnings (should fix)\n4. Suggestions (nice to have)\n5. What's Done Well\n6. Refactored code snippets where applicable`,
    };
  }

  // Data & Analytics
  if (category === "Data" || category === "Data & Analytics") {
    if (slug === "invoice-processor") {
      return {
        system: "You are an accounts payable specialist. Extract invoice data accurately. Every number must be exact \u2014 no rounding, no guessing. If a field is unclear, mark it as 'NEEDS VERIFICATION'.",
        user: `Invoice text:\n---\n${config.input_text || "(none)"}\n---\nFields to extract: ${config.fields_to_extract || "all"}\nOutput format: ${config.output_format || "JSON"}\n\nExtract the data precisely.`,
      };
    }
    return {
      system: "You are a data extraction and transformation specialist. Parse the provided text and extract structured data in the requested format. Be thorough \u2014 don't miss any data points. If data is ambiguous, note it.",
      user: `Input text:\n---\n${config.input_text || "(no input)"}\n---\nOutput format: ${config.output_format || "JSON"}\n\nExtract all identifiable data points and structure them in ${config.output_format || "JSON"} format.`,
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

      // Check email verification for non-scheduled runs
      const { data: { user: verifiedUser } } = await adminClient.auth.admin.getUserById(userId);
      if (verifiedUser && !verifiedUser.email_confirmed_at) {
        return new Response(
          JSON.stringify({ error: "Please verify your email before running agents. Check your inbox." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    // Daily run limit: 50 runs per day per user
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: userDeployments } = await adminClient
      .from("deployments")
      .select("id")
      .eq("user_id", userId);
    const userDepIds = (userDeployments ?? []).map(d => d.id);

    if (userDepIds.length > 0) {
      const { count: dailyRunCount } = await adminClient
        .from("runs")
        .select("id", { count: "exact", head: true })
        .in("deployment_id", userDepIds)
        .gte("created_at", oneDayAgo);

      if ((dailyRunCount ?? 0) >= 50) {
        return new Response(
          JSON.stringify({ error: "Daily run limit reached (50 runs/day). Upgrade your plan for higher limits." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    // Build prompt (now async for web search)
    const config = (deployment.config as Record<string, any>) ?? {};
    const { system, user: userMsg } = await getPrompt(agent.category, agent.slug, config);

    // Call OpenRouter with model fallback
    const MODELS = ["anthropic/claude-sonnet-4", "openai/gpt-4o-mini"];
    let llmData: any = null;
    let llmError: string | null = null;
    let modelUsed = MODELS[0];

    for (const model of MODELS) {
      try {
        const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: userMsg },
            ],
            max_tokens: 4000,
          }),
        });

        const data = await llmRes.json();
        if (llmRes.ok && !data.error) {
          llmData = data;
          modelUsed = model;
          break;
        }
        llmError = data.error?.message || JSON.stringify(data.error) || "LLM request failed";
        trackError(llmError, `model-fallback:${model}`);
      } catch (err: any) {
        llmError = err.message;
        trackError(err, `model-fallback:${model}`);
      }
    }

    if (!llmData) {
      // All models failed — refund and record failure
      await adminClient.rpc("refund_credits", { p_user_id: userId, p_amount: creditCost });
      await adminClient.from("transactions").insert({
        user_id: userId, type: "refund", credits: creditCost, amount_cents: 0,
      });
      await adminClient.from("runs").update({
        status: "failed", error_message: llmError || "All models failed", completed_at: new Date().toISOString(),
      }).eq("id", run.id);

      return new Response(JSON.stringify({ error: llmError }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract usage data
    const tokensUsed = llmData.usage?.total_tokens ?? 0;
    const apiCostCents = Math.ceil(tokensUsed / 1000);

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
        api_cost_cents: apiCostCents,
        model_used: modelUsed,
        tokens_used: tokensUsed,
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
  } catch (err) {
    trackError(err, "run-agent");
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
