import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRuns } from "@/hooks/useRealtimeRuns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { differenceInSeconds, differenceInMinutes } from "date-fns";
import ReactMarkdown from "react-markdown";

const statusStyles: Record<string, string> = {
  success: "bg-success text-success-foreground",
  failed: "bg-destructive text-destructive-foreground",
  running: "bg-primary text-primary-foreground",
  queued: "bg-muted text-muted-foreground",
};

const RunHistory = () => {
  const { user } = useAuth();
  useRealtimeRuns(user?.id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: deployments } = useQuery({
    queryKey: ["my-deployments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("deployments").select("*, agents(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: runs, isLoading } = useQuery({
    queryKey: ["my-runs", user?.id, deployments?.map((d) => d.id).join(",")],
    queryFn: async () => {
      const depIds = (deployments ?? []).map((d) => d.id);
      if (depIds.length === 0) return [];
      const { data } = await supabase.from("runs").select("*").in("deployment_id", depIds).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!deployments,
  });

  const filtered = (runs ?? []).filter((r) => statusFilter === "all" || r.status === statusFilter);

  const formatDuration = (run: any) => {
    if (!run.started_at || !run.completed_at) return "—";
    const secs = differenceInSeconds(new Date(run.completed_at), new Date(run.started_at));
    if (secs < 60) return `${secs}s`;
    return `${differenceInMinutes(new Date(run.completed_at), new Date(run.started_at))}m ${secs % 60}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-medium font-display">Run History</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No runs found.</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((run) => {
                const dep = (deployments ?? []).find((d) => d.id === run.deployment_id);
                const isExpanded = expanded === run.id;
                return (
                  <>
                    <TableRow key={run.id} className="cursor-pointer" onClick={() => setExpanded(isExpanded ? null : run.id)}>
                      <TableCell className="font-medium">{(dep as any)?.agents?.name ?? "—"}</TableCell>
                      <TableCell><Badge className={statusStyles[run.status] ?? ""}>{run.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDuration(run)}</TableCell>
                      <TableCell>{run.credits_used ?? 0}</TableCell>
                      <TableCell>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${run.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/50 p-4">
                          <div className="space-y-2 text-sm">
                            {run.input_summary && <p><span className="font-medium">Input:</span> {run.input_summary}</p>}
                            {run.output_summary && (
                              <div>
                                <span className="font-medium">Output:</span>
                                <div className="mt-1 bg-background p-3 rounded-lg border max-h-[500px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown>{run.output_summary}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                            {run.error_message && <p className="text-destructive"><span className="font-medium">Error:</span> {run.error_message}</p>}
                            {!run.input_summary && !run.output_summary && !run.error_message && <p className="text-muted-foreground">No details available.</p>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RunHistory;
