import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRealtimeRuns } from "@/hooks/useRealtimeRuns";
import { useRealtimeProfile } from "@/hooks/useRealtimeProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Zap, Clock, CheckCircle, ArrowRight, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const PERIODS = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

const PIE_COLORS = ["#E81E25", "#F7941D", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B"];

const Analytics = () => {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const { data: analyticsData, isLoading } = useAnalytics(user?.id, days);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useRealtimeRuns(user?.id);
  useRealtimeProfile(user?.id);

  const metrics = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return null;
    const total = analyticsData.length;
    const creditsSpent = analyticsData.reduce((s, r) => s + (r.credits_used ?? 0), 0);
    const durations = analyticsData.filter(r => r.duration_seconds != null).map(r => Number(r.duration_seconds));
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const successCount = analyticsData.filter(r => r.status === "success").length;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;
    return { total, creditsSpent, avgDuration, successRate };
  }, [analyticsData]);

  const runsOverTime = useMemo(() => {
    if (!analyticsData) return [];
    const grouped: Record<string, { date: string; success: number; failed: number }> = {};
    analyticsData.forEach(r => {
      const d = r.run_date as string;
      if (!grouped[d]) grouped[d] = { date: d, success: 0, failed: 0 };
      if (r.status === "success") grouped[d].success++;
      else if (r.status === "failed") grouped[d].failed++;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [analyticsData]);

  const creditsPerDay = useMemo(() => {
    if (!analyticsData) return [];
    const grouped: Record<string, { date: string; credits: number }> = {};
    analyticsData.forEach(r => {
      const d = r.run_date as string;
      if (!grouped[d]) grouped[d] = { date: d, credits: 0 };
      grouped[d].credits += r.credits_used ?? 0;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [analyticsData]);

  const agentDistribution = useMemo(() => {
    if (!analyticsData) return [];
    const grouped: Record<string, number> = {};
    analyticsData.forEach(r => {
      grouped[r.agent_name] = (grouped[r.agent_name] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [analyticsData]);

  const agentPerformance = useMemo(() => {
    if (!analyticsData) return [];
    const grouped: Record<string, typeof analyticsData> = {};
    analyticsData.forEach(r => {
      if (!grouped[r.agent_name]) grouped[r.agent_name] = [];
      grouped[r.agent_name].push(r);
    });
    return Object.entries(grouped).map(([name, runs]) => {
      const total = runs.length;
      const successes = runs.filter(r => r.status === "success").length;
      const successRate = total > 0 ? (successes / total) * 100 : 0;
      const durations = runs.filter(r => r.duration_seconds != null).map(r => Number(r.duration_seconds));
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const credits = runs.reduce((s, r) => s + (r.credits_used ?? 0), 0);
      const lastRun = runs.reduce((latest, r) => (r.created_at > latest ? r.created_at : latest), runs[0].created_at);
      return { name, runs: total, successRate, avgDuration, credits, lastRun };
    });
  }, [analyticsData]);

  const [sortCol, setSortCol] = useState<string>("runs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedPerformance = useMemo(() => {
    const list = [...agentPerformance];
    list.sort((a, b) => {
      const aVal = a[sortCol as keyof typeof a] as number;
      const bVal = b[sortCol as keyof typeof b] as number;
      return sortDir === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return list;
  }, [agentPerformance, sortCol, sortDir]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const sortIndicator = (col: string) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const forecast = useMemo(() => {
    if (!metrics || metrics.creditsSpent === 0) return null;
    const dailyRate = metrics.creditsSpent / days;
    const balance = profile?.credits_balance ?? 0;
    const daysRemaining = dailyRate > 0 ? Math.round(balance / dailyRate) : Infinity;
    return { dailyRate, balance, daysRemaining };
  }, [metrics, days, profile]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-md text-sm">
        <p className="font-medium mb-1">{label ? format(new Date(label), "MMM dd, yyyy") : ""}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.dataKey === "success" ? "Success" : "Failed"}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium font-display">Analytics</h1>
          <div className="flex gap-1"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[250px] rounded-xl" />
          <Skeleton className="h-[250px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-medium font-display">Analytics</h1>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <Button key={p.days} size="sm" variant={days === p.days ? "gradient" : "outline"} onClick={() => setDays(p.days)} className="rounded-full">
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="text-center py-20 space-y-4">
          <Activity size={48} className="mx-auto text-muted-foreground" />
          <h2 className="text-xl font-medium">No activity in the last {days} days</h2>
          <p className="text-muted-foreground">Run an agent to start seeing analytics here</p>
          <Button variant="gradient" asChild>
            <Link to="/marketplace">Go to Marketplace <ArrowRight size={14} className="ml-1" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-medium font-display">Analytics</h1>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <Button key={p.days} size="sm" variant={days === p.days ? "gradient" : "outline"} onClick={() => setDays(p.days)} className="rounded-full">
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Activity, label: "Total Runs", value: metrics.total, sub: `Last ${days} Days` },
            { icon: Zap, label: "Credits Spent", value: metrics.creditsSpent, sub: `~$${(metrics.creditsSpent * 0.10).toFixed(2)}` },
            { icon: Clock, label: "Avg Duration", value: `${metrics.avgDuration.toFixed(1)}s`, sub: "Per run" },
            { icon: CheckCircle, label: "Success Rate", value: `${metrics.successRate.toFixed(0)}%`, sub: `${Math.round(metrics.successRate * metrics.total / 100)}/${metrics.total} runs` },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <m.icon size={16} />
                  <span className="text-xs">{m.label}</span>
                </div>
                <p className="text-2xl font-medium">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Runs Over Time */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Runs Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={runsOverTime}>
              <defs>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickFormatter={v => format(new Date(v), "MMM dd")} className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="success" stroke="#10B981" fill="url(#successGradient)" animationDuration={1000} />
              <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="url(#failedGradient)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Credits + Agent Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-medium">Credits Consumed</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={creditsPerDay}>
                <defs>
                  <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E81E25" />
                    <stop offset="100%" stopColor="#F7941D" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={v => format(new Date(v), "MMM dd")} className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip formatter={(v: number) => [`${v} credits`, "Credits"]} labelFormatter={v => format(new Date(v), "MMM dd, yyyy")} />
                <Bar dataKey="credits" fill="url(#creditGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-medium">Agent Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={agentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {agentDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-medium fill-foreground">
                  {metrics?.total ?? 0}
                </text>
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-muted-foreground">
                  runs
                </text>
                <Tooltip formatter={(v: number, name: string) => [v, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Agent Performance</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("runs")}>Runs{sortIndicator("runs")}</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("successRate")}>Success Rate{sortIndicator("successRate")}</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("avgDuration")}>Avg Duration{sortIndicator("avgDuration")}</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("credits")}>Credits{sortIndicator("credits")}</TableHead>
                  <TableHead>Last Run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerformance.map(a => (
                  <TableRow key={a.name}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.runs}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={a.successRate} className={`h-2 w-16 ${a.successRate >= 80 ? "[&>div]:bg-green-500" : a.successRate >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"}`} />
                        <span className="text-xs">{a.successRate.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{a.avgDuration.toFixed(1)}s</TableCell>
                    <TableCell>{a.credits}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.lastRun), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Credit Forecast */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-muted-foreground" />
            <h3 className="font-medium">Credit Forecast</h3>
          </div>
          {forecast ? (
            <>
              <p className={`text-sm ${forecast.daysRemaining > 7 ? "text-green-600 dark:text-green-400" : forecast.daysRemaining >= 3 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive"}`}>
                At your current usage of {forecast.dailyRate.toFixed(1)} credits/day, your balance of {forecast.balance} credits will last approximately <span className="font-medium">{forecast.daysRemaining} days</span>.
              </p>
              <Link to="/dashboard/billing" className="text-sm text-accent hover:underline inline-flex items-center gap-1">
                Buy Credits <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No usage data yet. Run some agents to see your forecast!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
