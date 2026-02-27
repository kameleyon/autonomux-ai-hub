import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Star, ArrowRight, Search, Settings, Rocket, Mail, PenLine, SearchCheck, Zap, Lock, Code } from "lucide-react";
import logo from "@/assets/logo.png";
import { iconMap, defaultAgentIcon } from "@/lib/icons";
import { APP_CATEGORIES } from "@/lib/categories";

const Index = () => {
  const { data: agents } = useQuery({
    queryKey: ["featured-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("is_published", true)
        .order("rating", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: categoryCounts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("category")
        .eq("is_published", true);
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a) => {
        counts[a.category] = (counts[a.category] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative bg-secondary/30 dark:bg-sidebar text-foreground dark:text-sidebar-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12" style={{ minHeight: "85vh" }}>
          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium font-display tracking-tight leading-tight">
              Your <span className="text-gradient">AI Workforce</span>,<br />One Click Away
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Pick an AI agent, tell it what you need, and get results in seconds — blog posts, email replies, lead lists, meeting summaries, and more. No coding, no complexity.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button variant="gradient" size="lg" className="animate-shimmer" asChild>
                <Link to="/marketplace">Explore Agents</Link>
              </Button>
              <Button
                size="lg"
                className="bg-transparent border-2 border-foreground/60 text-foreground hover:bg-foreground/10 hover:border-foreground/80 dark:border-sidebar-foreground/60 dark:text-sidebar-foreground dark:hover:bg-sidebar-foreground/10 dark:hover:border-sidebar-foreground/80"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                How It Works
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              ✨ Start free — 25 credits included, no credit card required
            </p>
            {/* Trust stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
              {[
                { label: "AI Agents Ready", value: "10+" },
                { label: "Free Credits to Start", value: "25" },
                { label: "Avg Results Time", value: "<30s" },
              ].map((s) => (
                <div key={s.label} className="text-center animate-fade-in">
                  <p className="text-2xl font-medium text-gradient">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Glowing agent card mockup */}
          <div className="flex-1 flex justify-center">
            <Card className="w-96 bg-card dark:bg-sidebar-accent backdrop-blur border-border dark:border-sidebar-border shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Rocket size={28} />
                </div>
                <h3 className="font-medium text-lg text-card-foreground">AI Agent</h3>
                <p className="text-sm text-muted-foreground">Automate any task with a single click. Powered by AI.</p>
                <div className="flex gap-2">
                  <Badge variant="accent">Marketing</Badge>
                  <Badge className="bg-secondary dark:bg-sidebar-accent text-muted-foreground border-0">3 credits</Badge>
                </div>
                <Button variant="gradient" className="w-full" size="sm">Deploy Now</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What is an AI Agent — Explainer */}
      <section className="py-16 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="accent" className="mb-2">New to AI Agents?</Badge>
          <h2 className="text-2xl lg:text-3xl font-medium font-display">Think of AI Agents as Digital Employees</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            An AI agent is a smart assistant that does a specific job for you — automatically. Tell it what you need, 
            give it your preferences, and it works around the clock. No coding, no technical skills, just results.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="p-4 rounded-xl bg-card border space-y-2">
              <Mail size={24} className="text-primary" />
              <h3 className="font-medium text-sm">Email Agent</h3>
              <p className="text-xs text-muted-foreground">Paste an email you received → get a professional reply in your tone, instantly</p>
            </div>
            <div className="p-4 rounded-xl bg-card border space-y-2">
              <PenLine size={24} className="text-primary" />
              <h3 className="font-medium text-sm">Blog Writer</h3>
              <p className="text-xs text-muted-foreground">Tell it a topic → get a full SEO blog post with headings and structure in 30 seconds</p>
            </div>
            <div className="p-4 rounded-xl bg-card border space-y-2">
              <SearchCheck size={24} className="text-primary" />
              <h3 className="font-medium text-sm">Lead Finder</h3>
              <p className="text-xs text-muted-foreground">Set your target market → get a list of qualified leads with outreach angles</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div>
            <Badge variant="accent" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl lg:text-4xl font-medium font-display">Three Steps to Automation</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Pick Your Agent", desc: "Browse ready-made AI agents for email, content, leads, support, and more. Each one does a specific job.", icon: Search },
              { step: "2", title: "Set Your Preferences", desc: "Choose your tone, style, and options with simple dropdowns. No technical setup needed.", icon: Settings },
              { step: "3", title: "Get Results", desc: "Click go and get results in seconds. Schedule it to run automatically if you want.", icon: Rocket },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-medium">
                  {step}
                </div>
                <Icon size={28} className="mx-auto text-muted-foreground" />
                <h3 className="text-xl font-medium font-display">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Agents */}
      <section className="py-20 bg-secondary/30 dark:bg-sidebar-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="accent" className="mb-4">Featured</Badge>
              <h2 className="text-3xl font-medium font-display">Top-Rated Agents</h2>
            </div>
            <Link to="/marketplace" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(agents ?? []).map((agent) => {
              const Icon = iconMap[agent.icon_url ?? ""] ?? defaultAgentIcon;
              return (
                <Link key={agent.id} to={`/marketplace/${agent.slug}`}>
                  <Card className="cursor-pointer hover:-translate-y-0.5 h-full">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                          <Icon size={24} />
                        </div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Star size={14} fill="hsl(var(--accent))" stroke="none" className="shadow-sm" />
                          {Number(agent.rating).toFixed(1)}
                        </span>
                      </div>
                      <h3 className="font-medium text-lg">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="accent">{agent.category}</Badge>
                        <Badge variant="secondary">{agent.base_credit_cost} credits (~${(agent.base_credit_cost * 0.10).toFixed(2)})</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <Zap size={22} className="text-accent" />
              </div>
              <h3 className="font-medium">Results in Seconds</h3>
              <p className="text-sm text-muted-foreground">Every agent returns results in under 30 seconds. No waiting, no queues — just instant output.</p>
            </div>
            <div className="text-center space-y-3 p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <Lock size={22} className="text-accent" />
              </div>
              <h3 className="font-medium">Your Data Stays Private</h3>
              <p className="text-sm text-muted-foreground">Credentials are AES-256 encrypted. We never store anything in plain text. Your keys, your control.</p>
            </div>
            <div className="text-center space-y-3 p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket size={22} className="text-primary" />
              </div>
              <h3 className="font-medium">No Code Required</h3>
              <p className="text-sm text-muted-foreground">Pick an agent, set your preferences with simple dropdowns, click go. That's it — no programming, no setup guides.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-secondary/30 dark:bg-sidebar-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <Badge variant="accent" className="mb-4">Categories</Badge>
            <h2 className="text-3xl font-medium font-display">Find the Right Agent</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {APP_CATEGORIES.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                to={`/marketplace?category=${name}`}
                className="group rounded-xl border-2 border-border hover:border-accent p-6 text-center space-y-3 transition-all hover:-translate-y-0.5"
              >
                <Icon size={28} className="mx-auto text-muted-foreground group-hover:text-accent transition-colors" />
                <h3 className="font-medium">{name}</h3>
                {categoryCounts?.[name] != null && (
                  <span className="text-xs text-muted-foreground">{categoryCounts[name]} agents</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-secondary/50 dark:bg-sidebar text-foreground dark:text-sidebar-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-medium font-display">
            Ready to <span className="text-gradient">Automate</span>?
          </h2>
          <p className="text-muted-foreground">
            Start with 25 free credits — no credit card required. Set up your first AI agent in under 2 minutes.
          </p>
          <Button variant="gradient" size="lg" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
