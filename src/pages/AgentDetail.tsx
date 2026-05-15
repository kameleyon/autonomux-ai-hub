import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Star, ArrowLeft, Lock, Clock, CheckCircle, Users, Calendar, Zap, Loader2,
  BarChart2,
} from "lucide-react";
import { iconMap, defaultAgentIcon } from "@/lib/icons";
import { SEO } from "@/components/SEO";

const AgentDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [running, setRunning] = useState(false);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("slug", slug!)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: activeDeployment } = useQuery({
    queryKey: ["active-deployment", user?.id, agent?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("deployments")
        .select("id")
        .eq("user_id", user!.id)
        .eq("agent_id", agent!.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!agent,
  });

  const { data: agentStats } = useQuery({
    queryKey: ["agent-stats", agent?.id],
    queryFn: async () => {
      const { data: deployments } = await supabase
        .from("deployments")
        .select("id")
        .eq("agent_id", agent!.id);

      if (!deployments?.length) return { avgDuration: null, successRate: null, totalRuns: 0 };

      const depIds = deployments.map((d) => d.id);
      const { data: runs } = await supabase
        .from("runs")
        .select("status, started_at, completed_at")
        .in("deployment_id", depIds);

      if (!runs?.length) return { avgDuration: null, successRate: null, totalRuns: 0 };

      const completed = runs.filter((r) => r.started_at && r.completed_at);
      const avgSeconds = completed.length > 0
        ? completed.reduce((sum, r) => sum + (new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime()) / 1000, 0) / completed.length
        : null;

      const successful = runs.filter((r) => r.status === "success").length;
      const successRate = runs.length > 0 ? Math.round((successful / runs.length) * 100) : null;

      return { avgDuration: avgSeconds, successRate, totalRuns: runs.length };
    },
    enabled: !!agent,
  });

  const handleRunNow = async () => {
    if (!activeDeployment) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { deployment_id: activeDeployment.id },
      });
      if (error) {
        toast.error(error.message || "Run failed");
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Agent run started — results will appear in your dashboard shortly.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Run failed";
      toast.error(message);
    } finally {
      setRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Agent not found.</p>
          <Button variant="outline" onClick={() => navigate("/marketplace")}>
            <ArrowLeft size={16} className="mr-2" />Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[agent.icon_url ?? ""] ?? defaultAgentIcon;
  const credentials = agent.required_credentials ?? [];
  const useCases = (agent as Record<string, unknown>).use_cases as string[] | null;

  return (
    <div className="bg-background min-h-screen">
      {agent && (
        <SEO
          title={`${agent.name} — AI Agent | Autonomux`}
          description={`${agent.description} Start for ${agent.base_credit_cost} credits (~$${(agent.base_credit_cost * 0.10).toFixed(2)}) per run.`}
          url={`https://autonomux.lovable.app/marketplace/${agent.slug}`}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0">
            <Icon size={40} />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-medium font-display">{agent.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <Star size={14} fill="hsl(var(--accent))" stroke="none" className="shadow-sm" />
                {Number(agent.rating).toFixed(1)}
              </span>
              <Badge variant="accent">{agent.category}</Badge>
              <Badge variant="secondary">v{agent.version}</Badge>
            </div>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {activeDeployment ? (
              <Button variant="gradient" size="lg" onClick={handleRunNow} disabled={running}>
                {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
                Run Now
              </Button>
            ) : (
              <Button variant="gradient" size="lg" asChild>
                <Link to={`/deploy/${agent.id}`}>Set Up This Agent</Link>
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">{agent.base_credit_cost} credits per run (~${(agent.base_credit_cost * 0.10).toFixed(2)})</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-[65%]">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="config">Setup Preview</TabsTrigger>
                <TabsTrigger value="output">Example Output</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{agent.long_description || agent.description}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Use Cases</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {useCases && useCases.length > 0
                      ? useCases.map((uc, i) => <li key={i}>{uc}</li>)
                      : <>
                          <li>Automate repetitive {agent.category.toLowerCase()} tasks</li>
                          <li>Scale your operations without hiring</li>
                          <li>Get results in minutes, not hours</li>
                        </>
                    }
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="config" className="mt-6">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-medium mb-1">What You'll Set Up</h3>
                    <p className="text-sm text-muted-foreground mb-4">When you set up this agent, you'll configure these simple options:</p>
                    {(() => {
                      const schema = agent.config_schema as { fields?: Array<{ name: string; type: string; options?: string[]; default?: string; label?: string; placeholder?: string }> } | null;
                      const fields = schema?.fields ?? [];
                      if (fields.length === 0) return <p className="text-sm text-muted-foreground">No configuration needed — this agent works out of the box!</p>;
                      return (
                        <div className="space-y-3">
                          {fields.map((field) => (
                            <div key={field.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                              <div>
                                <p className="text-sm font-medium capitalize">{field.name.replace(/_/g, " ")}</p>
                                {field.type === "select" && field.options ? (
                                  <p className="text-xs text-muted-foreground">Choose from: {field.options.join(", ")}</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    {field.placeholder || field.label || (field.default ? `Example: "${field.default}"` : "You'll type this in")}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="output" className="mt-6">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-medium">What This Agent Produces</h3>
                    {(agent as any).example_output ? (
                      <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-accent">
                        <p className="text-sm text-muted-foreground">{(agent as any).example_output}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Run this agent to see real results — output appears in your dashboard within seconds.</p>
                    )}
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">
                        ⏱️ Average delivery: {agentStats?.avgDuration ? `${Math.round(agentStats.avgDuration)} seconds` : "under 30 seconds"} · 
                        💰 Cost: {agent.base_credit_cost} credits (~${(agent.base_credit_cost * 0.10).toFixed(2)})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:w-[35%] space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-medium">Details</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { icon: BarChart2, label: "Category", value: agent.category },
                    { icon: Star, label: "Cost", value: `${agent.base_credit_cost} credits (~$${(agent.base_credit_cost * 0.10).toFixed(2)})/run` },
                    { icon: Clock, label: "Avg Run Time", value: agentStats?.avgDuration ? `${Math.round(agentStats.avgDuration)}s` : "No data" },
                    { icon: CheckCircle, label: "Success Rate", value: agentStats?.successRate != null ? `${agentStats.successRate}%` : "No data" },
                    { icon: Users, label: "Deployments", value: String(agent.total_deployments) },
                    { icon: Calendar, label: "Last Updated", value: new Date(agent.updated_at).toLocaleDateString() },
                  ].map(({ icon: I, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <I size={14} /> {label}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {credentials.length > 0 && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-medium">Required Credentials</h3>
                  {credentials.map((cred) => (
                    <div key={cred} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock size={14} />
                      <span>{cred.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {credentials.length === 0 && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <CheckCircle size={16} />
                    <span className="font-medium">No API keys or credentials needed</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">This agent works right away — just set your preferences and go.</p>
                </CardContent>
              </Card>
            )}

            {activeDeployment ? (
              <Button variant="gradient" className="w-full" onClick={handleRunNow} disabled={running}>
                {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
                Run Now
              </Button>
            ) : (
              <Button variant="gradient" className="w-full" asChild>
                <Link to={`/deploy/${agent.id}`}>Set Up This Agent</Link>
              </Button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
