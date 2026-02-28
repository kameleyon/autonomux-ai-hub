import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";
import type { DeploymentWithAgent } from "@/types/deployment";
import type { Json } from "@/integrations/supabase/types";

const TEXTAREA_FIELDS = ["email_content", "input_text", "knowledge_base", "code", "transcript", "rules", "source_urls"];

const FRIENDLY_LABELS: Record<string, string> = {
  tone: "Choose your tone",
  response_length: "How detailed should it be?",
  email_content: "Paste the email you want to reply to",
  rules: "Any specific rules or instructions?",
  topic: "What topic should it write about?",
  word_count: "Approximate length",
  target_audience: "Who is this for?",
  input_text: "Paste your text or data here",
  output_format: "What format do you want?",
  knowledge_base: "Paste your FAQ or knowledge base content",
  question: "What question should it answer?",
  platforms: "Which platform(s)?",
  num_posts: "How many posts?",
  competitor_url: "Competitor website URL",
  focus_areas: "What to focus on?",
  industry: "Your industry",
  company_size: "Target company size",
  location: "Location or region",
  num_leads: "How many leads to find?",
  language: "Programming language",
  focus: "Review focus",
  code: "Paste your code here",
  fields_to_extract: "What data to extract?",
  transcript: "Paste the meeting transcript",
  output_type: "What kind of summary?",
  source_urls: "Source URLs to research (comma-separated)",
  writing_focus: "What angle or points to cover?",
  include_image: "Include a relevant image?",
};

// Fields that might get corrupted by queue popping — restore from title_generation_context
const CONTEXT_FIELDS = ["topic", "source_urls", "writing_focus", "target_audience", "tone"];

interface EditConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: DeploymentWithAgent;
}

export function EditConfigDialog({ open, onOpenChange, deployment }: EditConfigDialogProps) {
  const qc = useQueryClient();

  const { data: agent } = useQuery({
    queryKey: ["agent-schema", deployment.agent_id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("config_schema, slug").eq("id", deployment.agent_id).single();
      return data;
    },
    enabled: open,
  });

  const schema = agent?.config_schema as { fields?: Array<{ name: string; type: string; options?: string[]; default?: string | number }> } | null;
  const fields = schema?.fields ?? [];

  const currentConfig = (deployment.config ?? {}) as Record<string, any>;
  const savedContext = (currentConfig.title_generation_context ?? {}) as Record<string, string>;
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        // For context fields, prefer the preserved original value over potentially corrupted top-level
        if (CONTEXT_FIELDS.includes(f.name) && savedContext[f.name]) {
          initial[f.name] = savedContext[f.name];
        } else {
          initial[f.name] = currentConfig[f.name] != null ? String(currentConfig[f.name]) : "";
        }
      });
      // Also include fields from currentConfig not in schema
      Object.keys(currentConfig).forEach((k) => {
        if (k !== "scheduled_topic_queue" && k !== "title_generation_context" && !(k in initial)) {
          initial[k] = String(currentConfig[k] ?? "");
        }
      });
      setConfig(initial);
    }
  }, [open, fields.length]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updatedConfig: Record<string, any> = { ...currentConfig };
      Object.entries(config).forEach(([k, v]) => {
        if (v) updatedConfig[k] = v;
        else delete updatedConfig[k];
      });

      // Keep title generation context in sync with latest instructions
      updatedConfig.title_generation_context = {
        topic: updatedConfig.topic || "",
        source_urls: updatedConfig.source_urls || "",
        writing_focus: updatedConfig.writing_focus || "",
        target_audience: updatedConfig.target_audience || "",
        tone: updatedConfig.tone || "",
      };

      const { error } = await supabase
        .from("deployments")
        .update({ config: updatedConfig as unknown as Json })
        .eq("id", deployment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deployments"] });
      toast.success("Configuration updated!");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={18} />
            Edit Instructions
          </DialogTitle>
          <DialogDescription>
            Update the configuration for {deployment.agents?.name ?? "this agent"}. Changes apply to future runs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {fields.length > 0 ? fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{FRIENDLY_LABELS[field.name] || field.name.replace(/_/g, " ")}</Label>
              {field.type === "select" && field.options ? (
                <Select
                  value={config[field.name] ?? ""}
                  onValueChange={(v) => setConfig({ ...config, [field.name]: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : TEXTAREA_FIELDS.includes(field.name) ? (
                <Textarea
                  placeholder={String(field.default ?? "")}
                  value={config[field.name] ?? ""}
                  onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                  className="min-h-[100px]"
                />
              ) : (
                <Input
                  placeholder={String(field.default ?? "")}
                  value={config[field.name] ?? ""}
                  onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                />
              )}
            </div>
          )) : (
            Object.entries(config).map(([k, v]) => (
              <div key={k} className="space-y-2">
                <Label>{FRIENDLY_LABELS[k] || k.replace(/_/g, " ")}</Label>
                <Input
                  value={v}
                  onChange={(e) => setConfig({ ...config, [k]: e.target.value })}
                />
              </div>
            ))
          )}

          <Button
            variant="gradient"
            className="w-full"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
