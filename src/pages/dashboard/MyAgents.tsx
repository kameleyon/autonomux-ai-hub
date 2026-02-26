import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pause, Play, Trash2, Settings } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type DeploymentStatus = Database["public"]["Enums"]["deployment_status"];

const statusStyles: Record<string, string> = {
  active: "bg-success text-success-foreground",
  paused: "bg-warning text-warning-foreground",
  error: "bg-destructive text-destructive-foreground",
  stopped: "bg-muted text-muted-foreground",
};

const MyAgents = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

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
                <TableHead>Created</TableHead>
                <TableHead>Credits/Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deployments ?? []).map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium">{(dep as any).agents?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusStyles[dep.status] ?? ""}>{dep.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(dep.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{(dep as any).agents?.base_credit_cost ?? "—"}</TableCell>
                  <TableCell className="text-right space-x-1">
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MyAgents;
