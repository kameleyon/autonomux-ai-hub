import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Sparkles, Plus, X } from "lucide-react";
import type { DeploymentWithAgent } from "@/types/deployment";
import type { Json } from "@/integrations/supabase/types";

interface GenerateTitlesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: DeploymentWithAgent;
}

const extractHeading = (markdown?: string | null) => {
  if (!markdown) return null;
  const headingMatch = markdown.match(/^#{1,2}\s+(.+)$/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();
  return markdown.substring(0, 120).trim();
};

export function GenerateTitlesDialog({ open, onOpenChange, deployment }: GenerateTitlesDialogProps) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [localQueue, setLocalQueue] = useState<string[] | null>(null);

  const config = (deployment.config ?? {}) as Record<string, any>;
  const context = (config.title_generation_context ?? {}) as Record<string, string>;
  const savedQueue: string[] = config.scheduled_topic_queue ?? [];
  const existingQueue = localQueue ?? savedQueue;
  const effectiveTopic = (context.topic || config.topic || "") as string;
  const effectiveWritingFocus = (config.writing_focus || context.writing_focus || "") as string;
  const effectiveSourceUrls = (context.source_urls || config.source_urls || "") as string;
  const effectiveTargetAudience = (config.target_audience || context.target_audience || "") as string;
  const effectiveTone = (config.tone || context.tone || "") as string;

  const { data: pastTitles } = useQuery({
    queryKey: ["past-titles", deployment.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("runs")
        .select("output_summary")
        .eq("deployment_id", deployment.id)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? [])
        .map((r) => extractHeading(r.output_summary))
        .filter(Boolean) as string[];
    },
    enabled: open,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setTitles([]);
    setSelected(new Set());
    try {
      const allExisting = [...existingQueue, ...(pastTitles ?? [])];

      const { data, error } = await supabase.functions.invoke("generate-titles", {
        body: {
          topic: effectiveTopic,
          source_urls: effectiveSourceUrls,
          writing_focus: effectiveWritingFocus,
          target_audience: effectiveTargetAudience,
          tone: effectiveTone,
          existing_titles: allExisting,
        },
      });
      if (error) throw error;
      if (data?.titles?.length > 0) {
        setTitles(data.titles);
      } else {
        toast.error("No titles generated. Try updating topic, focus, or sources first.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate titles");
    } finally {
      setGenerating(false);
    }
  };

  const toggleTitle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const removeFromQueue = async (index: number) => {
    const updated = existingQueue.filter((_, i) => i !== index);
    setLocalQueue(updated);
    const { error } = await supabase
      .from("deployments")
      .update({ config: { ...config, scheduled_topic_queue: updated } as unknown as Json })
      .eq("id", deployment.id);
    if (error) {
      toast.error("Failed to remove title");
      setLocalQueue(null);
    } else {
      qc.invalidateQueries({ queryKey: ["my-deployments"] });
      toast.success("Title removed from queue");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newTitles = Array.from(selected).sort((a, b) => a - b).map((i) => titles[i]);
      const updatedQueue = [...existingQueue, ...newTitles];
      const { error } = await supabase
        .from("deployments")
        .update({ config: { ...config, scheduled_topic_queue: updatedQueue } as unknown as Json })
        .eq("id", deployment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deployments"] });
      toast.success(`${selected.size} titles added to the queue!`);
      setLocalQueue(null);
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} />
            Generate More Titles
          </DialogTitle>
          <DialogDescription>
            Generates titles from your saved instructions and excludes already-used themes.
            {existingQueue.length > 0 && (
              <span className="block mt-1 text-accent font-medium">
                📋 {existingQueue.length} title{existingQueue.length !== 1 ? "s" : ""} currently in queue
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto min-h-0 flex-1">
          {existingQueue.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">{existingQueue.length}</span>
                <span className="text-sm text-muted-foreground">title{existingQueue.length !== 1 ? "s" : ""} in queue</span>
              </div>
              {(pastTitles?.length ?? 0) > 0 && (
                <span className="text-xs text-muted-foreground">🔄 {pastTitles!.length} past excluded</span>
              )}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <Sparkles size={14} className="mr-2" />
            )}
            {generating ? "Generating..." : titles.length > 0 ? "Regenerate Titles" : "Generate 15 Title Ideas"}
          </Button>

          {titles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{selected.size} of {titles.length} selected</p>
                <button
                  className="text-xs text-accent hover:underline"
                  onClick={() => {
                    if (selected.size === titles.length) setSelected(new Set());
                    else setSelected(new Set(titles.map((_, i) => i)));
                  }}
                >
                  {selected.size === titles.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1">
                {titles.map((title, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      selected.has(i)
                        ? "bg-accent/10 border border-accent/30"
                        : "bg-muted/50 border border-transparent hover:bg-muted"
                    }`}
                  >
                    <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleTitle(i)} className="mt-0.5 shrink-0" />
                    <span className="leading-snug break-words min-w-0">{title}</span>
                  </label>
                ))}
              </div>

              {selected.size > 0 && (
                <Button
                  variant="gradient"
                  className="w-full"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Plus size={16} className="mr-2" />
                  )}
                  Add {selected.size} Title{selected.size !== 1 ? "s" : ""} to Queue
                </Button>
              )}
            </div>
          )}

          {existingQueue.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Current Queue ({existingQueue.length})</p>
              <div className="max-h-[150px] overflow-y-auto space-y-1">
                {existingQueue.map((t, i) => (
                  <div key={i} className="text-xs p-2 bg-muted/50 rounded flex items-center gap-2 min-w-0 group">
                    <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                    <span className="break-words min-w-0 flex-1">{t}</span>
                    <button
                      onClick={() => removeFromQueue(i)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0 bg-transparent border-0 cursor-pointer min-h-0"
                      title="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
