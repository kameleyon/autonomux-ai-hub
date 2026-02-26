import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Star, ArrowRight, Search, Settings, Rocket,
  Mail, BarChart2, Headphones, Database, FileText,
  Share2, Mic, Eye, PenTool, Megaphone, ShoppingCart, Code,
} from "lucide-react";
import logo from "@/assets/logo.png";

import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  mail: Mail, search: Search, "pen-tool": PenTool, "share-2": Share2,
  headphones: Headphones, database: Database, "file-text": FileText,
  "bar-chart-2": BarChart2, mic: Mic, eye: Eye,
};

const categories = [
  { name: "Marketing", icon: Megaphone },
  { name: "Sales", icon: ShoppingCart },
  { name: "Support", icon: Headphones },
  { name: "Data", icon: Database },
  { name: "Content", icon: PenTool },
  { name: "Email", icon: Mail },
  { name: "Social Media", icon: Share2 },
  { name: "Development", icon: Code },
];

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

  return (
    <div className="bg-background">
      {/* Hero — dark */}
      <section className="relative bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12" style={{ minHeight: "85vh" }}>
          <div className="flex-1 text-center lg:text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium font-display tracking-tight leading-tight">
              Your <span className="text-gradient">AI Workforce</span>,<br />One Click Away
            </h1>
            <p className="text-lg text-sidebar-foreground/60 max-w-xl mx-auto lg:mx-0">
              Deploy intelligent AI agents that automate your workflows — from lead generation to customer support, content creation to data analysis.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button variant="gradient" size="lg" className="animate-shimmer" asChild>
                <Link to="/marketplace">Explore Agents</Link>
              </Button>
              <Button variant="outline" size="lg" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
                Watch Demo
              </Button>
            </div>
            {/* Trust stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
              {[
                { label: "Agents", value: "500+" },
                { label: "Tasks Completed", value: "10,000+" },
                { label: "Uptime", value: "99.9%" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-medium text-gradient">{s.value}</p>
                  <p className="text-xs text-sidebar-foreground/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Glowing agent card mockup */}
          <div className="flex-1 flex justify-center">
            <Card className="w-72 bg-card/10 backdrop-blur border-sidebar-border shadow-[0_0_60px_-10px_hsl(var(--gradient-from)/0.4),0_0_40px_-15px_hsl(var(--gradient-to)/0.3)]">
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Rocket size={28} />
                </div>
                <h3 className="font-medium text-lg text-sidebar-foreground">AI Agent</h3>
                <p className="text-sm text-sidebar-foreground/50">Automate any task with a single click. Powered by AI.</p>
                <div className="flex gap-2">
                  <Badge variant="accent">Marketing</Badge>
                  <Badge className="bg-sidebar-accent text-sidebar-foreground/70 border-0">3 credits</Badge>
                </div>
                <Button variant="gradient" className="w-full" size="sm">Deploy Now</Button>
              </CardContent>
            </Card>
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
              { step: "1", title: "Browse", desc: "Explore our marketplace of 500+ AI agents across every category.", icon: Search },
              { step: "2", title: "Configure", desc: "Customize the agent with your preferences, credentials, and schedule.", icon: Settings },
              { step: "3", title: "Deploy", desc: "Launch your agent with one click. It runs autonomously 24/7.", icon: Rocket },
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
      <section className="py-20 bg-secondary/30">
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
              const Icon = iconMap[agent.icon_url ?? ""] ?? Rocket;
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
                        <Badge variant="secondary">{agent.base_credit_cost} credits</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <Badge variant="accent" className="mb-4">Categories</Badge>
            <h2 className="text-3xl font-medium font-display">Find the Right Agent</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                to={`/marketplace?category=${name}`}
                className="group rounded-xl border-2 border-border hover:border-accent p-6 text-center space-y-3 transition-all hover:-translate-y-0.5"
              >
                <Icon size={28} className="mx-auto text-muted-foreground group-hover:text-accent transition-colors" />
                <h3 className="font-medium">{name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-sidebar text-sidebar-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-medium font-display">
            Ready to <span className="text-gradient">Automate</span>?
          </h2>
          <p className="text-sidebar-foreground/60">
            Join thousands of teams using Autonomux to scale their operations with AI agents.
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
