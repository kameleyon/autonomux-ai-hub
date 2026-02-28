import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, source_urls, writing_focus, target_audience, tone, existing_titles } = await req.json();

    // Build context from sources (supports both URL lists and raw text datasets)
    let sourceContext = "";
    const sourceInput = typeof source_urls === "string" ? source_urls.trim() : "";
    const urls = sourceInput.match(/https?:\/\/[^\s,]+/g)?.slice(0, 3) ?? [];

    if (urls.length > 0) {
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; Autonomux/1.0)" },
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const html = await res.text();
            const text = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 1500);
            sourceContext += `\nSource (${url}): ${text}`;
          }
        } catch {
          // skip
        }
      }
    } else if (sourceInput) {
      sourceContext = `\nProvided source context:\n${sourceInput.substring(0, 3500)}`;
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingList = Array.isArray(existing_titles) ? existing_titles : [];
    const exclusionBlock = existingList.length > 0
      ? `\n\nIMPORTANT - The following titles have ALREADY been written or are queued. Do NOT suggest similar or identical titles. Avoid overlapping themes, angles, or sub-topics:\n${existingList.map((t: string) => `- ${t}`).join("\n")}\n\nGenerate titles that explore COMPLETELY DIFFERENT angles, sub-topics, or perspectives not covered above.`
      : "";

    const prompt = `Generate exactly 15 unique, SHORT, clickbait-worthy blog article titles based on these inputs.

${topic ? `Topic/Keyword: ${topic}` : ""}
${writing_focus ? `Writing Focus/Angle (PRIMARY): ${writing_focus}` : ""}
${target_audience ? `Target Audience: ${target_audience}` : ""}
${tone ? `Tone: ${tone}` : ""}
${sourceContext ? `\nSource material for context:\n${sourceContext}` : ""}
${exclusionBlock}

Requirements:
- Each title MUST be UNDER 10 WORDS — short, punchy, irresistible
- Use curiosity gaps, power words, unexpected angles
- Create titles that make people NEED to click
- Each title should cover a DIFFERENT angle or sub-topic
- Titles MUST be directly relevant to the intended subject
- If Writing Focus conflicts with Topic, PRIORITIZE Writing Focus
- Vary the format: provocative statements, questions, revelations, challenges
- Number them 1-15

Examples of great titles:
- "Your Birth Card Is Lying to You"
- "The Hidden Pattern Running Your Life"  
- "Why You Can't Stop Chasing Goalposts"
- "This Card Predicts Your Biggest Mistake"

Return ONLY the numbered list of 15 titles, nothing else.`;

    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a content strategist who generates compelling blog article titles. Stay strictly on the requested subject and reject off-topic themes.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
      }),
    });

    if (!llmRes.ok) {
      if (llmRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (llmRes.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required: AI usage credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const gatewayText = await llmRes.text();
      console.error("AI gateway error", llmRes.status, gatewayText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const llmData = await llmRes.json();
    const content = llmData.choices?.[0]?.message?.content ?? "";

    const titles = content
      .split("\n")
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line: string) => line.length > 5 && line.length < 200);

    return new Response(JSON.stringify({ titles: titles.slice(0, 15) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
