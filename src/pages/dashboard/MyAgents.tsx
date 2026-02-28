import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRuns } from "@/hooks/useRealtimeRuns";
import { useRealtimeDeployments } from "@/hooks/useRealtimeDeployments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pause, Play, Trash2, Zap, Loader2, Clock, Timer, Settings, Sparkles } from "lucide-react";
import { formatDistanceToNow, differenceInMinutes, differenceInHours, isPast } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import type { DeploymentWithAgent } from "@/types/deployment";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { EditConfigDialog } from "@/components/EditConfigDialog";
import { GenerateTitlesDialog } from "@/components/GenerateTitlesDialog";

type DeploymentStatus = Database["public"]["Enums"]["deployment_status"];

const statusStyles: Record<string, string> = {
  active: "bg-success text-success-foreground",
  paused: "bg-warning text-warning-foreground",
  error: "bg-destructive text-destructive-foreground",
  stopped: "bg-muted text-muted-foreground",
};

const INTERVAL_LABELS: Record<string, { label: string; emoji: string }> = {
  every_15_min: { label: "Every 15 min", emoji: "⏱️" },
  every_hour: { label: "Hourly", emoji: "⏱️" },
  every_6_hours: { label: "Every 6h", emoji: "⏱️" },
  every_12_hours: { label: "Every 12h", emoji: "⏱️" },
  daily: { label: "Daily", emoji: "📅" },
  weekly: { label: "Weekly", emoji: "📆" },
};

function formatCountdown(nextRunAt: string | null): { text: string; color: string } {
  if (!nextRunAt) return { text: "—", color: "text-muted-foreground" };
  const next = new Date(nextRunAt);
  if (isPast(next)) return { text: "Running soon…", color: "text-warning" };
  const mins = differenceInMinutes(next, new Date());
  const hrs = differenceInHours(next, new Date());
  if (mins < 60) return { text: `Next in ${mins}m`, color: "text-success" };
  if (hrs < 24) return { text: `Next in ${hrs}h ${mins % 60}m`, color: "text-success" };
  return { text: formatDistanceToNow(next, { addSuffix: true }), color: "text-success" };
}

const MyAgents = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  useRealtimeRuns(user?.id);
  useRealtimeDeployments(user?.id);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [scheduleDeployment, setScheduleDeployment] = useState<DeploymentWithAgent | null>(null);
  const [editConfigDeployment, setEditConfigDeployment] = useState<DeploymentWithAgent | null>(null);
  const [titlesDeployment, setTitlesDeployment] = useState<DeploymentWithAgent | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("credits_balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["my-deployments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("deployments")
        .select("*, agents(name, base_credit_cost)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as DeploymentWithAgent[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeploymentStatus }) => {
      const { error } = await supabase.from("deployments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deployments"] });
      toast.success("Status updated");
    },
  });

  const deleteDep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deployments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deployments"] });
      toast.success("Deployment deleted");
    },
  });

  const handleRun = async (deploymentId: string, creditCost: number) => {
    setRunningId(deploymentId);
    try {
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { deployment_id: deploymentId },
      });
      if (error) {
        toast.error(error.message || "Run failed");
      } else if (data?.error) {
        if (data.error === "Insufficient credits") {
          const balance = profile?.credits_balance ?? 0;
          toast.error(`You need ${creditCost} credits but only have ${balance}.`, {
            action: { label: "Buy Credits", onClick: () => window.location.href = "/dashboard/billing" },
          });
        } else {
          toast.error(typeof data.error === "string" ? data.error.substring(0, 100) : "Run failed");
        }
      } else {
        toast.success("Agent ran successfully!");
        qc.invalidateQueries({ queryKey: ["my-deployments"] });
        qc.invalidateQueries({ queryKey: ["my-runs"] });
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Run failed";
      toast.error(message);
    } finally {
      setRunningId(null);
    }
  };

  const ActionButtons = ({ dep }: { dep: DeploymentWithAgent }) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={dep.status !== "active" || runningId === dep.id}
        onClick={() => handleRun(dep.id, dep.agents?.base_credit_cost ?? 1)}
        title="Run agent"
      >
        {runningId === dep.id ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Zap size={16} className="text-accent" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setEditConfigDeployment(dep)}
        title="Edit instructions"
      >
        <Settings size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTitlesDeployment(dep)}
        title="Generate more titles"
      >
        <Sparkles size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setScheduleDeployment(dep)}
        title="Schedule"
        disabled={dep.status !== "active"}
      >
        <Clock size={16} />
      </Button>
      <Button
        variant="ghost" size="icon"
        onClick={() => updateStatus.mutate({
          id: dep.id,
          status: dep.status === "active" ? "paused" : "active",
        })}
      >
        {dep.status === "active" ? <Pause size={16} /> : <Play size={16} />}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this agent deployment and all its run history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDep.mutate(dep.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-medium font-display">My Agents</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (deployments ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No deployed agents yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(deployments ?? []).map((dep) => {
            const countdown = dep.schedule_enabled ? formatCountdown(dep.next_run_at) : null;
            const intervalInfo = dep.schedule_interval ? INTERVAL_LABELS[dep.schedule_interval] ?? null : null;
            return (
              <Card key={dep.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Row 1: Name + Status + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{dep.agents?.name ?? "—"}</span>
                      <Badge className={`shrink-0 ${statusStyles[dep.status] ?? ""}`}>{dep.status}</Badge>
                    </div>
                    <ActionButtons dep={dep} />
                  </div>
                  {/* Row 2: Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Schedule</p>
                      <p className="font-medium mt-0.5">
                        {dep.schedule_enabled && intervalInfo
                          ? `${intervalInfo.emoji} ${intervalInfo.label}`
                          : "Not scheduled"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Run</p>
                      <p className={`font-medium mt-0.5 flex items-center gap-1 ${countdown?.color ?? "text-muted-foreground"}`}>
                        {countdown ? <><Timer size={12} />{countdown.text}</> : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Run</p>
                      <p className="font-medium mt-0.5">
                        {dep.last_run_at
                          ? formatDistanceToNow(new Date(dep.last_run_at), { addSuffix: true })
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Credits/Run</p>
                      <p className="font-medium mt-0.5">{dep.agents?.base_credit_cost ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {scheduleDeployment && (
        <ScheduleDialog
          open={!!scheduleDeployment}
          onOpenChange={(open) => !open && setScheduleDeployment(null)}
          deploymentId={scheduleDeployment.id}
          currentInterval={scheduleDeployment.schedule_interval}
          scheduleEnabled={scheduleDeployment.schedule_enabled ?? false}
          nextRunAt={scheduleDeployment.next_run_at}
          creditCost={scheduleDeployment.agents?.base_credit_cost ?? 1}
        />
      )}

      {editConfigDeployment && (
        <EditConfigDialog
          open={!!editConfigDeployment}
          onOpenChange={(open) => !open && setEditConfigDeployment(null)}
          deployment={editConfigDeployment}
        />
      )}

      {titlesDeployment && (
        <GenerateTitlesDialog
          open={!!titlesDeployment}
          onOpenChange={(open) => !open && setTitlesDeployment(null)}
          deployment={titlesDeployment}
        />
      )}
    </div>
  );
};

export default MyAgents;
