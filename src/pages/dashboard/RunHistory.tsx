import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRuns } from "@/hooks/useRealtimeRuns";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, Coins, Copy } from "lucide-react";
import { differenceInSeconds, differenceInMinutes } from "date-fns";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { DeploymentWithAgent } from "@/types/deployment";

const ALLOWED_MARKDOWN_ELEMENTS = ["p", "h1", "h2", "h3", "h4", "strong", "em", "ul", "ol", "li", "code", "pre", "blockquote", "img", "a"];

const statusStyles: Record<string, string> = {
  success: "bg-success text-success-foreground",
  failed: "bg-destructive text-destructive-foreground",
  running: "bg-accent text-accent-foreground",
  queued: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 20;

const RunHistory = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  useRealtimeRuns(user?.id);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Output copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const { data: deployments } = useQuery({
    queryKey: ["my-deployments", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("deployments").select("*, agents(name, base_credit_cost)").eq("user_id", user!.id);
      return (data ?? []) as DeploymentWithAgent[];
    },
    enabled: !!user,
  });

  const depIdKey = (deployments ?? []).map((d) => d.id).sort().join(",");

  const { data: runs, isLoading } = useQuery({
    queryKey: ["my-runs", user?.id, depIdKey],
    queryFn: async () => {
      const depIds = (deployments ?? []).map((d) => d.id);
      if (depIds.length === 0) return [];
      const { data } = await supabase.from("runs").select("*").in("deployment_id", depIds).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!deployments,
  });

  const agentOptions = Array.from(
    new Map(
      (deployments ?? []).map((d) => [d.agent_id, d.agents?.name ?? "Unknown"])
    ).entries()
  );

  const filtered = (runs ?? []).filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (agentFilter !== "all") {
      const dep = (deployments ?? []).find((d) => d.id === r.deployment_id);
      if (dep?.agent_id !== agentFilter) return false;
    }
    return true;
  });

  const totalCredits = filtered.reduce((sum, r) => sum + (r.credits_used ?? 0), 0);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    const runId = searchParams.get("run");
    if (!runId || !(runs ?? []).some((run) => run.id === runId)) return;

    const runIndex = filtered.findIndex((run) => run.id === runId);
    if (runIndex >= 0) {
      setExpanded(runId);
      setPage(Math.floor(runIndex / PAGE_SIZE));
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("run");
    setSearchParams(nextParams, { replace: true });
  }, [filtered, runs, searchParams, setSearchParams]);

  const formatDuration = (run: { started_at: string | null; completed_at: string | null }) => {
    if (!run.started_at || !run.completed_at) return "—";
    const secs = differenceInSeconds(new Date(run.completed_at), new Date(run.started_at));
    if (secs < 60) return `${secs}s`;
    return `${differenceInMinutes(new Date(run.completed_at), new Date(run.started_at))}m ${secs % 60}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-medium font-display">Run History</h1>
          {filtered.length > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Coins size={14} /> Total credits used: <span className="font-medium text-foreground">{totalCredits}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-40"><SelectValue placeholder="All Agents" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agentOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No runs found.</CardContent></Card>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((run) => {
              const dep = (deployments ?? []).find((d) => d.id === run.deployment_id);
              const isExpanded = expanded === run.id;
              const isScheduled = run.input_summary?.startsWith("[Scheduled");
              return (
                <Card key={run.id}>
                  <CardContent
                    className="p-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : run.id)}
                  >
                    {/* Row 1: Agent name + status + expand */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isScheduled && <Clock size={13} className="text-accent shrink-0" />}
                        <span className="font-medium text-sm truncate">{dep?.agents?.name ?? "—"}</span>
                        <Badge className={`shrink-0 ${statusStyles[run.status] ?? ""}`}>{run.status}</Badge>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                    </div>
                    {/* Row 2: Meta */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>{run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</span>
                      <span>Duration: {formatDuration(run)}</span>
                      <span>Credits: {run.credits_used ?? 0}</span>
                    </div>
                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm" onClick={(e) => e.stopPropagation()}>
                        {run.input_summary && <p><span className="font-medium">Input:</span> {run.input_summary}</p>}
                        {run.output_summary && (
                          <div>
                            <span className="font-medium">Output:</span>
                            <div className="mt-1 bg-background p-3 rounded-lg border max-h-[500px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown
                                components={{
                                  img: ({ node, ...props }) => (
                                    <img {...props} loading="lazy" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '0.5rem', margin: '1rem 0' }} />
                                  ),
                                }}
                              >
                                {run.output_summary}
                              </ReactMarkdown>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => copyToClipboard(run.output_summary ?? "")}
                            >
                              <Copy size={14} className="mr-1.5" /> Copy Output
                            </Button>
                          </div>
                        )}
                        {run.error_message && <p className="text-destructive"><span className="font-medium">Error:</span> {run.error_message}</p>}
                        {!run.input_summary && !run.output_summary && !run.error_message && <p className="text-muted-foreground">No details available.</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({filtered.length} runs)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={16} className="mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RunHistory;
