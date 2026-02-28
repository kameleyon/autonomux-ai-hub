import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Sparkles, Plus } from "lucide-react";
import type { DeploymentWithAgent } from "@/types/deployment";
import type { Json } from "@/integrations/supabase/types";

interface GenerateTitlesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: DeploymentWithAgent;
}

export function GenerateTitlesDialog({ open, onOpenChange, deployment }: GenerateTitlesDialogProps) {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const config = (deployment.config ?? {}) as Record<string, any>;
  const existingQueue: string[] = config.scheduled_topic_queue ?? [];

  const handleGenerate = async () => {
    setGenerating(true);
    setTitles([]);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("generate-titles", {
        body: {
          topic: config.topic || "",
          source_urls: config.source_urls || "",
          writing_focus: config.writing_focus || "",
          target_audience: config.target_audience || "",
          tone: config.tone || "",
        },
      });
      if (error) throw error;
      if (data?.titles?.length > 0) {
        setTitles(data.titles);
      } else {
        toast.error("No titles generated. Try updating your topic or sources first.");
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
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} />
            Generate More Titles
          </DialogTitle>
          <DialogDescription>
            Generate AI title suggestions and add them to your scheduled topic queue.
            {existingQueue.length > 0 && (
              <span className="block mt-1 text-accent font-medium">
                📋 {existingQueue.length} title{existingQueue.length !== 1 ? "s" : ""} currently in queue
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
              <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                {titles.map((title, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      selected.has(i)
                        ? "bg-accent/10 border border-accent/30"
                        : "bg-muted/50 border border-transparent hover:bg-muted"
                    }`}
                  >
                    <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleTitle(i)} className="mt-0.5" />
                    <span className="leading-snug">{title}</span>
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
                  <div key={i} className="text-xs p-2 bg-muted/50 rounded flex items-center gap-2">
                    <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                    <span className="truncate">{t}</span>
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
