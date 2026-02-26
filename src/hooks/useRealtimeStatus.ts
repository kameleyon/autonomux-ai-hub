import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeStatus() {
  const [status, setStatus] = useState<"connected" | "reconnecting" | "disconnected">("reconnecting");

  useEffect(() => {
    const channel = supabase
      .channel("status-probe")
      .on("postgres_changes", { event: "*", schema: "public", table: "runs" }, () => {})
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("connected");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("disconnected");
        else setStatus("reconnecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return status;
}
