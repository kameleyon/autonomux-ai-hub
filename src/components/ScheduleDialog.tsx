import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const INTERVALS = [
  { value: "every_15_min", label: "Every 15 minutes" },
  { value: "every_hour", label: "Hourly" },
  { value: "every_6_hours", label: "Every 6 hours" },
  { value: "every_12_hours", label: "Every 12 hours" },
  { value: "daily", label: "Daily (9 AM UTC)" },
  { value: "weekly", label: "Weekly (Mon 9 AM UTC)" },
];

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deploymentId: string;
  currentInterval: string | null;
  scheduleEnabled: boolean;
  nextRunAt: string | null;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  deploymentId,
  currentInterval,
  scheduleEnabled,
  nextRunAt,
}: ScheduleDialogProps) {
  const qc = useQueryClient();
  const [interval, setInterval] = useState(currentInterval ?? "every_hour");

  const scheduleMutation = useMutation({
    mutationFn: async ({ action, interval }: { action: string; interval?: string }) => {
      const { data, error } = await supabase.functions.invoke("schedule-agent", {
        body: { deployment_id: deploymentId, action, interval },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["my-deployments"] });
      if (variables.action === "enable") {
        toast.success("Schedule enabled!");
      } else {
        toast.success("Schedule disabled.");
      }
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update schedule");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={18} />
            Schedule Agent
          </DialogTitle>
          <DialogDescription>
            Configure automatic recurring runs for this agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {scheduleEnabled && (
            <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-sm">
              <p className="font-medium text-success">✓ Schedule Active</p>
              <p className="text-muted-foreground mt-1">
                Running{" "}
                <span className="font-medium text-foreground">
                  {INTERVALS.find((i) => i.value === currentInterval)?.label ?? currentInterval}
                </span>
              </p>
              {nextRunAt && (
                <p className="text-muted-foreground">
                  Next run{" "}
                  {new Date(nextRunAt) > new Date()
                    ? formatDistanceToNow(new Date(nextRunAt), { addSuffix: true })
                    : "soon..."}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Frequency</label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="gradient"
              className="flex-1"
              disabled={scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate({ action: "enable", interval })}
            >
              {scheduleMutation.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              {scheduleEnabled ? "Update Schedule" : "Enable Schedule"}
            </Button>
            {scheduleEnabled && (
              <Button
                variant="outline"
                disabled={scheduleMutation.isPending}
                onClick={() => scheduleMutation.mutate({ action: "disable" })}
              >
                Disable
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
