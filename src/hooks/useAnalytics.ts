import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAnalytics(userId: string | undefined, days: number) {
  return useQuery({
    queryKey: ["analytics", userId, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_analytics", {
        p_user_id: userId!,
        p_days: days,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}
