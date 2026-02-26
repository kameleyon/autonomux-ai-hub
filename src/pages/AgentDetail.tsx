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
  Star, ArrowLeft, Lock, Clock, CheckCircle, Users, Calendar, Rocket, Zap, Loader2,
  BarChart2,
} from "lucide-react";
import { iconMap, defaultAgentIcon } from "@/lib/icons";

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
        toast.success("Agent ran successfully!");
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
                <Link to={`/deploy/${agent.id}`}>Deploy This Agent</Link>
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">{agent.base_credit_cost} credits per run</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-[65%]">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
                  <CardContent className="p-5">
                    <h3 className="font-medium mb-3">Configuration Schema</h3>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(agent.config_schema, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reviews" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <p>No reviews yet. Deploy this agent and be the first to review!</p>
                </div>
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
                    { icon: Star, label: "Cost", value: `${agent.base_credit_cost} credits/run` },
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

            {activeDeployment ? (
              <Button variant="gradient" className="w-full" onClick={handleRunNow} disabled={running}>
                {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
                Run Now
              </Button>
            ) : (
              <Button variant="gradient" className="w-full" asChild>
                <Link to={`/deploy/${agent.id}`}>Deploy This Agent</Link>
              </Button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
