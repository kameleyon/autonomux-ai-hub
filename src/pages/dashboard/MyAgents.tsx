import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pause, Play, Trash2, Zap, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { ScheduleDialog } from "@/components/ScheduleDialog";

type DeploymentStatus = Database["public"]["Enums"]["deployment_status"];

const statusStyles: Record<string, string> = {
  active: "bg-success text-success-foreground",
  paused: "bg-warning text-warning-foreground",
  error: "bg-destructive text-destructive-foreground",
  stopped: "bg-muted text-muted-foreground",
};

const INTERVAL_LABELS: Record<string, string> = {
  every_15_min: "Every 15 min",
  every_hour: "Hourly",
  every_6_hours: "Every 6h",
  every_12_hours: "Every 12h",
  daily: "Daily",
  weekly: "Weekly",
};

const MyAgents = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [runningId, setRunningId] = useState<string | null>(null);
  const [scheduleDeployment, setScheduleDeployment] = useState<any | null>(null);

  const { data: deployments, isLoading } = useQuery({
    queryKey: ["my-deployments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("deployments")
        .select("*, agents(name, base_credit_cost)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
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

  const handleRun = async (deploymentId: string) => {
    setRunningId(deploymentId);
    try {
      const { data, error } = await supabase.functions.invoke("run-agent", {
        body: { deployment_id: deploymentId },
      });
      if (error) {
        toast.error(error.message || "Run failed");
      } else if (data?.error) {
        if (data.error === "Insufficient credits") {
          toast.error("Insufficient credits");
        } else {
          toast.error(data.error);
        }
      } else {
        toast.success("Agent ran successfully!");
        qc.invalidateQueries({ queryKey: ["my-deployments"] });
        qc.invalidateQueries({ queryKey: ["my-runs"] });
        qc.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (err: any) {
      toast.error(err.message || "Run failed");
    } finally {
      setRunningId(null);
    }
  };

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Credits/Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deployments ?? []).map((dep) => {
                const d = dep as any;
                return (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{d.agents?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusStyles[dep.status] ?? ""}>{dep.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.schedule_enabled ? (
                        <span className="flex items-center gap-1.5 text-success">
                          <Clock size={14} />
                          {INTERVAL_LABELS[d.schedule_interval] ?? d.schedule_interval}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.last_run_at
                        ? formatDistanceToNow(new Date(d.last_run_at), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell>{d.agents?.base_credit_cost ?? "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={dep.status !== "active" || runningId === dep.id}
                        onClick={() => handleRun(dep.id)}
                        title="Run agent"
                      >
                        {runningId === dep.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Zap size={16} className="text-primary" />
                        )}
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
                      <Button variant="ghost" size="icon" onClick={() => deleteDep.mutate(dep.id)}>
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {scheduleDeployment && (
        <ScheduleDialog
          open={!!scheduleDeployment}
          onOpenChange={(open) => !open && setScheduleDeployment(null)}
          deploymentId={scheduleDeployment.id}
          currentInterval={(scheduleDeployment as any).schedule_interval}
          scheduleEnabled={(scheduleDeployment as any).schedule_enabled ?? false}
          nextRunAt={(scheduleDeployment as any).next_run_at}
        />
      )}
    </div>
  );
};

export default MyAgents;
