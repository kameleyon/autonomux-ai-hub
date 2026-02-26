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
        // Note: runs table doesn't have a user_id column directly, so we can't filter
        // by user at the subscription level. RLS ensures users only see their own data
        // in queries, and the subscription just triggers query invalidation.
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
