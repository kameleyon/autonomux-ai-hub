import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeRuns(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("runs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "runs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-runs"] });
          queryClient.invalidateQueries({ queryKey: ["my-runs-overview"] });
          queryClient.invalidateQueries({ queryKey: ["my-deployments"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
