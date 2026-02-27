import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRuns } from "@/hooks/useRealtimeRuns";
import { useRealtimeDeployments } from "@/hooks/useRealtimeDeployments";
import { useCountUp } from "@/hooks/useCountUp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Zap, Coins, TrendingUp, Plus, AlertTriangle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { DeploymentWithAgent } from "@/types/deployment";
import type { LucideIcon } from "lucide-react";

const PLAN_LIMITS: Record<string, number | null> = {
  free: 3,
  pro: null,
  business: null,
};

const ALLOWED_MARKDOWN_ELEMENTS = ["p", "h1", "h2", "h3", "h4", "strong", "em", "ul", "ol", "li", "code", "pre", "blockquote"];

const StatCard = ({
  label,
  value,
  icon: Icon,
  suffix = "",
  sublabel,
  children,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
  sublabel?: string;
  children?: React.ReactNode;
}) => {
  const { value: animated, ref } = useCountUp(value);
  return (
    <div ref={ref}>
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0">
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-medium leading-tight">{animated}{suffix}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {sublabel && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sublabel}</p>}
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Overview = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  useRealtimeRuns(user?.id);
  useRealtimeDeployments(user?.id);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: deployments } = useQuery({
    queryKey: ["my-deployments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("deployments").select("*, agents(name, base_credit_cost)").eq("user_id", user!.id);
      return (data ?? []) as DeploymentWithAgent[];
    },
    enabled: !!user,
  });

  const { data: runs } = useQuery({
    queryKey: ["my-runs-overview", user?.id],
    queryFn: async () => {
      const depIds = (deployments ?? []).map((d) => d.id);
      if (depIds.length === 0) return [];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("runs")
        .select("*")
        .in("deployment_id", depIds)
        .gte("created_at", startOfMonth.toISOString())
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!deployments,
  });

  const activeAgents = (deployments ?? []).filter((d) => d.status === "active").length;
  const scheduledAgents = (deployments ?? []).filter((d) => d.schedule_enabled === true).length;
  const totalRuns = runs?.length ?? 0;
  const successRuns = (runs ?? []).filter((r) => r.status === "success").length;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
  const creditsBalance = profile?.credits_balance ?? 0;

  const planTier = profile?.plan_tier ?? "free";
  const planLimit = PLAN_LIMITS[planTier];
  const planMaxCredits = planTier === "free" ? 25 : planTier === "pro" ? 200 : 1000;
  const creditPercent = Math.min(100, Math.round((creditsBalance / planMaxCredits) * 100));
  const creditColor = creditPercent > 50 ? "bg-success" : creditPercent > 20 ? "bg-warning" : "bg-destructive";

  const agentLimit = planLimit;

  const handleRunAgain = async (deploymentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { deployment_id: deploymentId },
      });
      if (error) {
        toast.error(error.message || "Run failed");
      } else if (data?.error) {
        if (data.error === "Insufficient credits") {
          toast.error(`You don't have enough credits. You need credits but only have ${creditsBalance}.`, {
            action: { label: "Buy Credits", onClick: () => window.location.href = "/dashboard/billing" },
          });
        } else {
          toast.error(data.error);
        }
      } else {
        toast.success("Agent ran successfully!");
        qc.invalidateQueries({ queryKey: ["my-runs-overview"] });
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Run failed";
      toast.error(message);
    }
  };

  const statusColors: Record<string, string> = {
    success: "bg-success text-success-foreground",
    failed: "bg-destructive text-destructive-foreground",
    running: "bg-accent text-accent-foreground",
    queued: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {creditsBalance <= 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle size={16} className="text-destructive shrink-0" />
          <p className="text-xs text-destructive">No credits remaining. Buy credits to run your agents.</p>
          <Button variant="outline" size="sm" asChild className="ml-auto shrink-0 text-xs h-7">
            <Link to="/dashboard/billing">Buy Credits</Link>
          </Button>
        </div>
      )}
      {creditsBalance > 0 && creditsBalance < 10 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <p className="text-xs text-foreground">{creditsBalance} credits remaining — running low.</p>
          <Button variant="outline" size="sm" asChild className="ml-auto shrink-0 text-xs h-7">
            <Link to="/dashboard/billing">Buy Credits</Link>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Welcome back, {profile?.display_name ?? "there"}!</p>
        </div>
        <Button variant="gradient" size="sm" asChild>
          <Link to="/marketplace"><Plus size={14} className="mr-1.5" />Deploy New Agent</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Active Agents"
          value={activeAgents}
          icon={Bot}
          sublabel={agentLimit ? `Limit: ${agentLimit} (${planTier})` : undefined}
        />
        <StatCard label="Scheduled" value={scheduledAgents} icon={Clock} />
        <StatCard label="Runs This Month" value={totalRuns} icon={Zap} />
        <StatCard label="Credits Remaining" value={creditsBalance} icon={Coins}>
          <div className="mt-1.5">
            <Progress value={creditPercent} className="h-1" indicatorClassName={creditColor} />
          </div>
        </StatCard>
        <StatCard label="Success Rate" value={successRate} icon={TrendingUp} suffix="%" />
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h2>
        {(runs ?? []).length === 0 ? (
          <Card><CardContent className="p-8 text-center text-xs text-muted-foreground">No runs yet. Deploy an agent to get started!</CardContent></Card>
        ) : (
          <div className="space-y-1.5">
            {(runs ?? []).slice(0, 5).map((run) => {
              const dep = (deployments ?? []).find((d) => d.id === run.deployment_id);
              return (
                <Card key={run.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{dep?.agents?.name ?? "Agent"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(run.created_at).toLocaleString()}</p>
                      {run.status === "success" && run.output_summary && (
                        <div className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 prose prose-xs max-w-none dark:prose-invert [&_*]:text-[11px] [&_*]:leading-relaxed [&_*]:m-0">
                          <ReactMarkdown allowedElements={ALLOWED_MARKDOWN_ELEMENTS}>
                            {run.output_summary.substring(0, 120) + "..."}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] px-2 py-0.5 ${statusColors[run.status] ?? ""}`}>{run.status}</Badge>
                      {dep && dep.status === "active" && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => handleRunAgain(dep.id)}>
                          <Zap size={12} className="mr-1" /> Run Again
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
