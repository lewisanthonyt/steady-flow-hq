import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Mail,
  PoundSterling,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Sparkles,
  Phone,
  ListTodo,
  CalendarDays,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  jobs,
  customers,
  monthlyRevenue,
  jobCompletionWeekly,
  TARGET_MONTHLY,
  gbp,
  statusColor,
  STATUS_ORDER,
  tasks,
  priorityColor,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Steady Works HQ" },
      { name: "description", content: "Overview of jobs, revenue and growth." },
    ],
  }),
  component: DashboardPage,
});

function Kpi({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
  trendLabel?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={accent ? "border-primary/30 shadow-md" : ""}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {title}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              {trendLabel && (
                <p className={`mt-1 text-xs flex items-center gap-1 ${trend === "up" ? "text-success" : "text-destructive"}`}>
                  {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trendLabel}
                </p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardPage() {
  const thisMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const profit = thisMonth.revenue - thisMonth.expenses;
  const targetPct = Math.min(100, Math.round((thisMonth.revenue / TARGET_MONTHLY) * 100));

  const upcoming = jobs.filter((j) => new Date(j.date) >= new Date(new Date().toDateString())).slice(0, 5);
  const quotesAwaiting = jobs.filter((j) => j.status === "Quote Sent" || j.status === "Awaiting Approval").length;

  const pipeline = STATUS_ORDER.map((s) => ({
    status: s,
    count: jobs.filter((j) => j.status === s).length,
  }));

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Good morning, Boss 👷‍♂️</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening in the business today.</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </Badge>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi title="Money In (Apr)" value={gbp(thisMonth.revenue)} icon={PoundSterling} trend="up" trendLabel="+18% vs Mar" accent />
          <Kpi title="Money Out (Apr)" value={gbp(thisMonth.expenses)} icon={TrendingDown} trend="down" trendLabel="-5% vs Mar" />
          <Kpi title="Monthly Profit" value={gbp(profit)} icon={TrendingUp} trend="up" trendLabel="Healthy margin" />
          <Kpi title="Jobs This Week" value={String(jobs.filter(j => {
            const d = new Date(j.date); const now = new Date();
            const start = new Date(now); start.setDate(now.getDate() - now.getDay());
            const end = new Date(start); end.setDate(start.getDate() + 7);
            return d >= start && d < end;
          }).length)} icon={Briefcase} />
          <Kpi title="Completed (Apr)" value={String(jobs.filter(j => ["Completed","Invoiced","Paid"].includes(j.status)).length)} icon={CheckCircle2} />
          <Kpi title="Quotes Awaiting" value={String(quotesAwaiting)} icon={Mail} />
          <Kpi title="Active Customers" value={String(customers.length)} icon={Users} />
          <Kpi title="Staff Active" value="2 / 2" icon={Users} />
        </div>

        {/* Target */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Monthly Revenue Target</p>
                  <p className="text-xs text-muted-foreground">{gbp(thisMonth.revenue)} of {gbp(TARGET_MONTHLY)}</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">{targetPct}%</div>
            </div>
            <Progress value={targetPct} className="h-3" />
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `£${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => gbp(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#rev)" name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#exp)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jobs Completed (Weekly)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobCompletionWeekly} margin={{ left: -20, right: 10, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="completed" fill="var(--color-chart-1)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline + Upcoming */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {pipeline.map((p) => (
                  <div key={p.status} className="rounded-lg border bg-card p-3">
                    <div className="text-xs text-muted-foreground">{p.status}</div>
                    <div className="text-2xl font-bold mt-1">{p.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map((j) => (
                <div key={j.id} className="flex items-start justify-between gap-2 text-sm border-b last:border-0 pb-2 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{j.customer}</div>
                    <div className="text-xs text-muted-foreground truncate">{j.jobType}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold">{new Date(j.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                    <div className="text-[10px] text-muted-foreground">{j.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent enquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobs.slice(0, 6).map((j) => (
                <div key={j.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {j.customer.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{j.customer}</div>
                      <div className="text-xs text-muted-foreground truncate">{j.jobType} · {j.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{j.priceQuoted ? gbp(j.priceQuoted) : "—"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(j.status)}`}>{j.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
