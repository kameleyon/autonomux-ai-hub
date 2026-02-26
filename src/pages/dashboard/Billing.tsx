import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeProfile } from "@/hooks/useRealtimeProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const creditPacks = [
  { credits: 100, price: 10, label: "Starter", key: "starter" },
  { credits: 500, price: 45, label: "Growth", key: "growth", popular: true },
  { credits: 2000, price: 160, label: "Scale", key: "scale" },
];

const Billing = () => {
  const { user } = useAuth();
  useRealtimeProfile(user?.id);
  const [selected, setSelected] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Credits purchased successfully! Your balance will update shortly.");
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Purchase canceled.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const tierLabel = (profile?.plan_tier ?? "free").charAt(0).toUpperCase() + (profile?.plan_tier ?? "free").slice(1);

  const handlePurchase = async () => {
    if (selected === null) return;
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packKey: creditPacks[selected].key },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-medium font-display">Billing</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-2xl font-medium">{tierLabel}</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">Upgrade Plan</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Credits Balance</p>
            <p className="text-2xl font-medium flex items-center gap-2">
              <Coins size={20} className="text-accent" /> {profile?.credits_balance ?? 0}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm">Buy Credits</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Buy Credits</DialogTitle></DialogHeader>
                <div className="grid gap-3 py-4">
                  {creditPacks.map((pack, i) => (
                    <Card
                      key={i}
                      className={`cursor-pointer transition-all ${selected === i ? "ring-2 ring-accent" : ""} ${pack.popular ? "border-accent" : ""}`}
                      onClick={() => setSelected(i)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{pack.label}</p>
                          <p className="text-sm text-muted-foreground">{pack.credits} credits</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium">${pack.price}</p>
                          {pack.popular && <Badge variant="accent" className="text-xs">Best Value</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button variant="gradient" disabled={selected === null || purchasing} className="w-full" onClick={handlePurchase}>
                  {purchasing ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {purchasing ? "Redirecting…" : `Purchase ${selected !== null ? `$${creditPacks[selected].price}` : ""}`}
                </Button>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Transaction History</h2>
        {(transactions ?? []).length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No transactions yet.</CardContent></Card>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactions ?? []).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="capitalize">{tx.type}</TableCell>
                    <TableCell>{tx.credits ?? 0}</TableCell>
                    <TableCell>{tx.amount_cents ? `$${(tx.amount_cents / 100).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
