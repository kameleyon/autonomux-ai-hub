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

const PLAN_LIMITS: Record<string, number | null> = {
  free: 3,
  pro: null,
  business: null,
};

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
  icon: any;
  suffix?: string;
  sublabel?: string;
  children?: React.ReactNode;
}) => {
  const { value: animated, ref } = useCountUp(value);
  return (
    <div ref={ref}>
      <Card className="hover:-translate-y-0.5 transition-transform">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0">
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-medium">{animated}{suffix}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {sublabel && <p className="text-xs text-muted-foreground/70">{sublabel}</p>}
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
      const { data } = await supabase.from("deployments").select("*, agents(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: runs } = useQuery({
    queryKey: ["my-runs-overview", user?.id],
    queryFn: async () => {
      const depIds = (deployments ?? []).map((d) => d.id);
      if (depIds.length === 0) return [];
      // Get runs from this month only
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
  const scheduledAgents = (deployments ?? []).filter((d: any) => d.schedule_enabled).length;
  const totalRuns = runs?.length ?? 0;
  const successRuns = (runs ?? []).filter((r) => r.status === "success").length;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
  const creditsBalance = profile?.credits_balance ?? 0;

  // Plan-based credit progress
  const planTier = profile?.plan_tier ?? "free";
  const planLimit = PLAN_LIMITS[planTier];
  const planMaxCredits = planTier === "free" ? 25 : planTier === "pro" ? 200 : 1000;
  const creditPercent = Math.min(100, Math.round((creditsBalance / planMaxCredits) * 100));
  const creditColor = creditPercent > 50 ? "bg-success" : creditPercent > 20 ? "bg-warning" : "bg-destructive";

  const agentLimit = planLimit;
  const agentLimitLabel = agentLimit ? `${activeAgents} of ${agentLimit}` : `${activeAgents}`;

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
    } catch (err: any) {
      toast.error(err.message || "Run failed");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Credits Warning */}
      {creditsBalance <= 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle size={20} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">🚫 No credits remaining. Buy credits to run your agents.</p>
          <Button variant="outline" size="sm" asChild className="ml-auto shrink-0">
            <Link to="/dashboard/billing">Buy Credits</Link>
          </Button>
        </div>
      )}
      {creditsBalance > 0 && creditsBalance < 10 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle size={20} className="text-warning shrink-0" />
          <p className="text-sm text-foreground">⚠️ Low credits! You have {creditsBalance} credits remaining.</p>
          <Button variant="outline" size="sm" asChild className="ml-auto shrink-0">
            <Link to="/dashboard/billing">Buy Credits</Link>
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {profile?.display_name ?? "there"}!</p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/marketplace"><Plus size={16} className="mr-2" />Deploy New Agent</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Agents"
          value={activeAgents}
          icon={Bot}
          sublabel={agentLimit ? `Limit: ${agentLimit} (${planTier})` : "Unlimited"}
        />
        <StatCard label="Scheduled" value={scheduledAgents} icon={Clock} />
        <StatCard
          label="Total Runs"
          value={totalRuns}
          icon={Zap}
          sublabel="This month"
        />
        <StatCard
          label="Credits Remaining"
          value={creditsBalance}
          icon={Coins}
        >
          <div className="mt-2">
            <Progress value={creditPercent} className="h-1.5" indicatorClassName={creditColor} />
          </div>
        </StatCard>
        <StatCard label="Success Rate" value={successRate} icon={TrendingUp} suffix="%" />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        {(runs ?? []).length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No runs yet. Deploy an agent to get started!</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {(runs ?? []).slice(0, 5).map((run) => {
              const dep = (deployments ?? []).find((d) => d.id === run.deployment_id);
              const statusColors: Record<string, string> = {
                success: "bg-success text-success-foreground",
                failed: "bg-destructive text-destructive-foreground",
                running: "bg-primary text-primary-foreground",
                queued: "bg-muted text-muted-foreground",
              };
              return (
                <Card key={run.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{(dep as any)?.agents?.name ?? "Agent"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</p>
                      {run.status === "success" && run.output_summary && (
                        <div className="text-xs text-muted-foreground mt-1 truncate prose prose-xs max-w-none dark:prose-invert">
                          <ReactMarkdown>{run.output_summary.substring(0, 100) + "..."}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusColors[run.status] ?? ""}>{run.status}</Badge>
                      {dep && dep.status === "active" && (
                        <Button variant="ghost" size="sm" onClick={() => handleRunAgain(dep.id)}>
                          <Zap size={14} className="mr-1" /> Run Again
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
