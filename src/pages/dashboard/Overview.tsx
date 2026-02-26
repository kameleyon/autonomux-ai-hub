import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountUp } from "@/hooks/useCountUp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, Coins, TrendingUp, Plus } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, suffix = "" }: { label: string; value: number; icon: any; suffix?: string }) => {
  const { value: animated, ref } = useCountUp(value);
  return (
    <div ref={ref}>
      <Card className="hover:-translate-y-0.5 transition-transform">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <p className="text-2xl font-medium">{animated}{suffix}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Overview = () => {
  const { user } = useAuth();

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
      const { data } = await supabase.from("runs").select("*").in("deployment_id", depIds).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
    enabled: !!deployments,
  });

  const activeAgents = (deployments ?? []).filter((d) => d.status === "active").length;
  const totalRuns = runs?.length ?? 0;
  const successRuns = (runs ?? []).filter((r) => r.status === "success").length;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium font-display">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {profile?.display_name ?? "there"}!</p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/marketplace"><Plus size={16} className="mr-2" />Deploy New Agent</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Agents" value={activeAgents} icon={Bot} />
        <StatCard label="Total Runs" value={totalRuns} icon={Zap} />
        <StatCard label="Credits Remaining" value={profile?.credits_balance ?? 0} icon={Coins} />
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
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(dep as any)?.agents?.name ?? "Agent"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</p>
                    </div>
                    <Badge className={statusColors[run.status] ?? ""}>{run.status}</Badge>
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
