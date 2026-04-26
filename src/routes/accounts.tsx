import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Camera,
  Download,
  PoundSterling,
  Receipt,
  TrendingUp,
  Wallet,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  Percent,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { jobs, quotes, expenses, monthlyRevenue, gbp, TARGET_MONTHLY } from "@/lib/mock-data";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts & Financial Intelligence — Steady Works HQ" },
      {
        name: "description",
        content: "Real-time financial dashboard, calculators, forecasts and snapshot exports.",
      },
    ],
  }),
  component: AccountsPage,
});

type RangeKey = "today" | "week" | "month" | "quarter" | "year" | "custom";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

const VAT_RATE = 0.2;

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function withinRange(dateStr: string, range: RangeKey) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (range) {
    case "today":
      return d.getTime() === today.getTime();
    case "week":
      return d >= daysAgo(7) && d <= today;
    case "month":
      return d >= daysAgo(30) && d <= today;
    case "quarter":
      return d >= daysAgo(90) && d <= today;
    case "year":
      return d >= daysAgo(365) && d <= today;
    case "custom":
      return true;
  }
}

function AccountsPage() {
  const [range, setRange] = useState<RangeKey>("month");

  // ============= Derived metrics =============
  const m = useMemo(() => {
    const paid = jobs.filter((j) => j.status === "Paid");
    const invoiced = jobs.filter((j) => j.status === "Invoiced");

    const revenueIn = (r: RangeKey) =>
      paid.filter((j) => withinRange(j.date, r)).reduce((s, j) => s + j.finalInvoice, 0);

    const revenueWeek = revenueIn("week");
    const revenueMonth = revenueIn("month");
    const revenueYear = revenueIn("year");
    const revenueRange = revenueIn(range);

    const outstanding = invoiced.reduce((s, j) => s + j.finalInvoice, 0);
    const paidTotal = paid.reduce((s, j) => s + j.finalInvoice, 0);

    const quotesPending = quotes.filter((q) => q.status === "Sent" || q.status === "Draft");
    const quotesPendingValue = quotesPending.reduce((s, q) => s + q.price, 0);
    const quotesAccepted = quotes.filter((q) => q.status === "Accepted").length;
    const conversionRate =
      quotes.length > 0 ? Math.round((quotesAccepted / quotes.length) * 100) : 0;

    const materialsSpend = expenses
      .filter((e) => e.category === "Materials")
      .reduce((s, e) => s + e.amount, 0);
    const labourSpend = expenses
      .filter((e) => e.category === "Labour")
      .reduce((s, e) => s + e.amount, 0);
    const contractorSpend = labourSpend; // labour subcontract treated as contractor
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const grossProfit = paidTotal - materialsSpend;
    const netProfit = paidTotal - totalExpenses;

    const vatCollected = paidTotal * VAT_RATE;
    const vatPaid = materialsSpend * VAT_RATE;
    const vatOwed = vatCollected - vatPaid;

    const completedJobs = paid.length || 1;
    const avgJobValue = paidTotal / completedJobs;

    const cashIn = paidTotal;
    const cashOut = totalExpenses;

    // Forecast: pipeline value (booked + in progress + accepted quotes)
    const pipelineJobs = jobs
      .filter((j) => j.status === "Booked" || j.status === "In Progress" || j.status === "Awaiting Approval")
      .reduce((s, j) => s + j.priceQuoted, 0);
    const acceptedQuotesValue = quotes
      .filter((q) => q.status === "Accepted")
      .reduce((s, q) => s + q.price, 0);
    const forecast30 = pipelineJobs + acceptedQuotesValue + outstanding;

    return {
      revenueWeek,
      revenueMonth,
      revenueYear,
      revenueRange,
      outstanding,
      paidTotal,
      quotesPending,
      quotesPendingValue,
      conversionRate,
      grossProfit,
      netProfit,
      materialsSpend,
      labourSpend,
      contractorSpend,
      totalExpenses,
      vatCollected,
      vatOwed,
      avgJobValue,
      cashIn,
      cashOut,
      forecast30,
    };
  }, [range]);

  // Cash flow chart data
  const cashFlow = monthlyRevenue.map((row) => ({
    month: row.month,
    in: row.revenue,
    out: row.expenses,
    net: row.revenue - row.expenses,
  }));

  const expenseByCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const monthTargetPct = Math.min(100, Math.round((m.revenueMonth / TARGET_MONTHLY) * 100));

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Financial Intelligence Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
              Accounts &amp; Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live picture of where Steady Works stands today — revenue, profit, pipeline, VAT.
            </p>
          </div>
          <RangeFilter value={range} onChange={setRange} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="calculators" className="gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Calculators
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="gap-1.5">
              <Target className="h-3.5 w-3.5" /> Forecasting
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Snapshots
            </TabsTrigger>
          </TabsList>

          {/* ===================== DASHBOARD ===================== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Headline KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi
                label="Revenue This Week"
                value={gbp(m.revenueWeek)}
                trend="+12%"
                up
                icon={<PoundSterling className="h-4 w-4" />}
              />
              <Kpi
                label="Revenue This Month"
                value={gbp(m.revenueMonth)}
                trend="+8%"
                up
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <Kpi
                label="Revenue This Year"
                value={gbp(m.revenueYear)}
                trend="+24%"
                up
                icon={<Banknote className="h-4 w-4" />}
              />
              <Kpi
                label="Net Profit"
                value={gbp(m.netProfit)}
                trend={`${Math.round((m.netProfit / Math.max(1, m.paidTotal)) * 100)}% margin`}
                up
                accent="success"
                icon={<Wallet className="h-4 w-4" />}
              />
            </div>

            {/* Money status row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatusCard
                title="Outstanding Invoices"
                value={gbp(m.outstanding)}
                hint={`${jobs.filter((j) => j.status === "Invoiced").length} invoices awaiting payment`}
                tone="warning"
                icon={<Clock className="h-4 w-4" />}
              />
              <StatusCard
                title="Paid Invoices"
                value={gbp(m.paidTotal)}
                hint={`${jobs.filter((j) => j.status === "Paid").length} invoices paid in full`}
                tone="success"
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <StatusCard
                title="Quotes Pending"
                value={gbp(m.quotesPendingValue)}
                hint={`${m.quotesPending.length} quotes out — ${m.conversionRate}% conversion rate`}
                tone="info"
                icon={<Receipt className="h-4 w-4" />}
              />
            </div>

            {/* Monthly target progress */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Monthly Target Progress</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {gbp(m.revenueMonth)} of {gbp(TARGET_MONTHLY)} — keep pushing.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold tabular-nums">{monthTargetPct}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      to target
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={monthTargetPct} className="h-3" />
              </CardContent>
            </Card>

            {/* Cash In vs Cash Out + Profit trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cash In vs Cash Out</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlow}>
                      <defs>
                        <linearGradient id="cashIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cashOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                        }}
                        formatter={(v: number) => gbp(v)}
                      />
                      <Legend />
                      <Area
                        name="Cash In"
                        type="monotone"
                        dataKey="in"
                        stroke="var(--color-success)"
                        fill="url(#cashIn)"
                        strokeWidth={2}
                      />
                      <Area
                        name="Cash Out"
                        type="monotone"
                        dataKey="out"
                        stroke="var(--color-primary)"
                        fill="url(#cashOut)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Spend Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 8,
                        }}
                        formatter={(v: number) => gbp(v)}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Profit + spend tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat label="Gross Profit" value={gbp(m.grossProfit)} icon={<TrendingUp />} />
              <MiniStat label="Materials Spend" value={gbp(m.materialsSpend)} icon={<Receipt />} />
              <MiniStat label="Labour / Contractor" value={gbp(m.labourSpend)} icon={<Wallet />} />
              <MiniStat label="Average Job Value" value={gbp(m.avgJobValue)} icon={<Banknote />} />
            </div>

            {/* VAT + Forecast */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="bg-gradient-to-br from-card to-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" /> VAT Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">{gbp(m.vatCollected)}</div>
                  <p className="text-xs text-muted-foreground mt-1">20% on paid invoices</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-warning/10 to-card border-warning/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" /> VAT Owed (Est.)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">{gbp(m.vatOwed)}</div>
                  <p className="text-xs text-muted-foreground mt-1">After input VAT on materials</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-card border-success/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-success" /> Forecast Next 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">{gbp(m.forecast30)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pipeline + accepted + outstanding
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===================== CALCULATORS ===================== */}
          <TabsContent value="calculators" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProfitCalculator />
              <MonthlyPositionCalculator metrics={m} />
              <QuoteMarginCalculator />
              <BreakEvenCalculator />
              <VatCalculator />
              <StaffCostCalculator />
              <GrowthCalculator current={m.revenueMonth} />
            </div>
          </TabsContent>

          {/* ===================== FORECASTING ===================== */}
          <TabsContent value="forecasting" className="space-y-4">
            <ForecastingPanel />
          </TabsContent>

          {/* ===================== SNAPSHOTS ===================== */}
          <TabsContent value="snapshots" className="space-y-4">
            <SnapshotsPanel metrics={m} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/* ================== Sub components ================== */

function RangeFilter({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  const opts: { v: RangeKey; label: string }[] = [
    { v: "today", label: "Today" },
    { v: "week", label: "Week" },
    { v: "month", label: "Month" },
    { v: "quarter", label: "Quarter" },
    { v: "year", label: "Year" },
    { v: "custom", label: "Custom" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === o.v
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  trend,
  up,
  icon,
  accent,
}: {
  label: string;
  value: string;
  trend?: string;
  up?: boolean;
  icon?: React.ReactNode;
  accent?: "success" | "primary";
}) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          accent === "success" ? "bg-success" : "bg-primary",
        )}
      />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            {label}
          </span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="text-2xl md:text-[28px] font-bold tracking-tight tabular-nums mt-2">
          {value}
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs mt-1.5 font-medium",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCard({
  title,
  value,
  hint,
  tone,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "warning" | "success" | "info";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "warning"
      ? "border-warning/40 bg-warning/5"
      : tone === "success"
        ? "border-success/40 bg-success/5"
        : "border-primary/40 bg-primary/5";
  return (
    <Card className={cn("border", toneClass)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center",
              tone === "warning" && "bg-warning/20 text-foreground",
              tone === "success" && "bg-success/20 text-success",
              tone === "info" && "bg-primary/15 text-primary",
            )}
          >
            {icon}
          </span>
          {title}
        </div>
        <div className="text-3xl font-bold tabular-nums mt-3">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest font-medium">
          <span className="h-6 w-6 rounded bg-muted flex items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
          </span>
          {label}
        </div>
        <div className="text-xl font-bold tabular-nums mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

/* ================== Calculators ================== */

function CalcShell({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function CalcRow({
  label,
  value,
  onChange,
  prefix = "£",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-2">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
        <Input
          type="number"
          className="pl-7 tabular-nums"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        highlight && "border-t pt-3 mt-2",
      )}
    >
      <span
        className={cn(
          "text-xs uppercase tracking-widest text-muted-foreground",
          highlight && "text-foreground font-semibold",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums font-semibold",
          highlight ? "text-xl text-primary" : "text-sm",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ProfitCalculator() {
  // Pull a sample job for autofill
  const [jobId, setJobId] = useState<string>("custom");
  const [price, setPrice] = useState(2000);
  const [materials, setMaterials] = useState(600);
  const [labour, setLabour] = useState(400);
  const [contractor, setContractor] = useState(0);
  const [extras, setExtras] = useState(50);

  function applyJob(id: string) {
    setJobId(id);
    if (id === "custom") return;
    const j = jobs.find((x) => x.id === id);
    if (!j) return;
    setPrice(j.priceQuoted || j.finalInvoice);
    setMaterials(j.materialsCost);
    setLabour(0);
    setContractor(0);
    setExtras(0);
  }

  const totalCost = materials + labour + contractor + extras;
  const gross = price - materials;
  const net = price - totalCost;
  const margin = price > 0 ? (net / price) * 100 : 0;

  return (
    <CalcShell
      title="Profit Calculator"
      description="Auto-pull a job or enter values manually."
      icon={<Calculator />}
    >
      <Select value={jobId} onValueChange={applyJob}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Choose a job…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Custom values</SelectItem>
          {jobs.slice(0, 8).map((j) => (
            <SelectItem key={j.id} value={j.id}>
              {j.jobType} — {j.customer}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <CalcRow label="Job price" value={price} onChange={setPrice} />
      <CalcRow label="Materials" value={materials} onChange={setMaterials} />
      <CalcRow label="Labour" value={labour} onChange={setLabour} />
      <CalcRow label="Contractor cost" value={contractor} onChange={setContractor} />
      <CalcRow label="Fuel / extras" value={extras} onChange={setExtras} />
      <ResultRow label="Gross Profit" value={gbp(gross)} />
      <ResultRow label="Net Profit" value={gbp(net)} />
      <ResultRow label="Margin" value={`${margin.toFixed(1)}%`} highlight />
    </CalcShell>
  );
}

function MonthlyPositionCalculator({
  metrics,
}: {
  metrics: { paidTotal: number; totalExpenses: number; outstanding: number; forecast30: number };
}) {
  const income = metrics.paidTotal;
  const expensesT = metrics.totalExpenses;
  const outstanding = metrics.outstanding;
  const predicted = metrics.forecast30;
  const net = income + outstanding - expensesT;

  return (
    <CalcShell
      title="Monthly Position"
      description="Auto-calculated from your CRM, jobs and invoices."
      icon={<Wallet />}
    >
      <ResultRow label="Total income (paid)" value={gbp(income)} />
      <ResultRow label="Total expenses" value={gbp(expensesT)} />
      <ResultRow label="Outstanding invoices" value={gbp(outstanding)} />
      <ResultRow label="Predicted incoming (30d)" value={gbp(predicted)} />
      <ResultRow label="Net Monthly Position" value={gbp(net)} highlight />
    </CalcShell>
  );
}

function QuoteMarginCalculator() {
  const [quote, setQuote] = useState(1500);
  const [costs, setCosts] = useState(900);
  const margin = quote > 0 ? ((quote - costs) / quote) * 100 : 0;
  const profit = quote - costs;
  const healthy = margin >= 30;
  return (
    <CalcShell
      title="Quote Margin"
      description="Make sure pricing leaves real profit."
      icon={<Percent />}
    >
      <CalcRow label="Quote amount" value={quote} onChange={setQuote} />
      <CalcRow label="Estimated costs" value={costs} onChange={setCosts} />
      <ResultRow label="Profit" value={gbp(profit)} />
      <ResultRow label="Margin" value={`${margin.toFixed(1)}%`} highlight />
      <Badge
        className={cn(
          "w-full justify-center py-1.5",
          healthy
            ? "bg-success text-success-foreground"
            : "bg-destructive text-destructive-foreground",
        )}
      >
        {healthy ? "✓ Healthy margin" : "⚠ Margin too low"}
      </Badge>
    </CalcShell>
  );
}

function BreakEvenCalculator() {
  const [fixed, setFixed] = useState(4000);
  const [avgJob, setAvgJob] = useState(450);
  const [avgCost, setAvgCost] = useState(180);
  const profitPerJob = avgJob - avgCost;
  const jobsNeeded = profitPerJob > 0 ? Math.ceil(fixed / profitPerJob) : 0;
  const revenueNeeded = jobsNeeded * avgJob;
  return (
    <CalcShell
      title="Break-Even"
      description="How many jobs to cover monthly costs."
      icon={<Target />}
    >
      <CalcRow label="Monthly fixed costs" value={fixed} onChange={setFixed} />
      <CalcRow label="Average job price" value={avgJob} onChange={setAvgJob} />
      <CalcRow label="Average cost per job" value={avgCost} onChange={setAvgCost} />
      <ResultRow label="Profit per job" value={gbp(profitPerJob)} />
      <ResultRow label="Revenue needed" value={gbp(revenueNeeded)} />
      <ResultRow label="Jobs to break-even" value={`${jobsNeeded} jobs`} highlight />
    </CalcShell>
  );
}

function VatCalculator() {
  const [amount, setAmount] = useState(1200);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const vat = mode === "add" ? amount * VAT_RATE : amount - amount / (1 + VAT_RATE);
  const total = mode === "add" ? amount + vat : amount;
  const net = mode === "add" ? amount : amount - vat;
  return (
    <CalcShell
      title="VAT Calculator"
      description="Add or strip 20% VAT in seconds."
      icon={<Percent />}
    >
      <div className="flex gap-1 bg-muted/60 p-1 rounded-md w-fit">
        <button
          onClick={() => setMode("add")}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded",
            mode === "add" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          Add VAT
        </button>
        <button
          onClick={() => setMode("remove")}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded",
            mode === "remove" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          Remove VAT
        </button>
      </div>
      <CalcRow
        label={mode === "add" ? "Net amount" : "Gross amount"}
        value={amount}
        onChange={setAmount}
      />
      <ResultRow label="Net" value={gbp(net)} />
      <ResultRow label="VAT (20%)" value={gbp(vat)} />
      <ResultRow label="Gross total" value={gbp(total)} highlight />
    </CalcShell>
  );
}

function StaffCostCalculator() {
  const [staff, setStaff] = useState(2);
  const [hourly, setHourly] = useState(22);
  const [hoursWeek, setHoursWeek] = useState(40);
  const weekly = staff * hourly * hoursWeek;
  const monthly = weekly * 4.33;
  const annual = weekly * 52;
  return (
    <CalcShell
      title="Staff Cost"
      description="Track total wages and labour spend."
      icon={<Wallet />}
    >
      <CalcRow label="Number of staff" value={staff} onChange={setStaff} prefix="#" />
      <CalcRow label="Hourly rate" value={hourly} onChange={setHourly} />
      <CalcRow label="Hours per week" value={hoursWeek} onChange={setHoursWeek} prefix="h" />
      <ResultRow label="Weekly cost" value={gbp(weekly)} />
      <ResultRow label="Monthly cost" value={gbp(monthly)} />
      <ResultRow label="Annual cost" value={gbp(annual)} highlight />
    </CalcShell>
  );
}

function GrowthCalculator({ current }: { current: number }) {
  const targets = [10000, 20000, 50000];
  return (
    <CalcShell
      title="Growth Targets"
      description="What revenue is needed to hit your goal?"
      icon={<TrendingUp />}
    >
      {targets.map((t) => {
        const gap = Math.max(0, t - current);
        const pct = Math.min(100, Math.round((current / t) * 100));
        return (
          <div key={t} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">{gbp(t)}/month</span>
              <span className="text-muted-foreground">
                {gap > 0 ? `${gbp(gap)} to go` : "✓ Hit"}
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        );
      })}
    </CalcShell>
  );
}

/* ================== Forecasting ================== */

function ForecastingPanel() {
  const acceptedQuotes = quotes.filter((q) => q.status === "Accepted");
  const sentQuotes = quotes.filter((q) => q.status === "Sent");
  const upcomingJobs = jobs.filter(
    (j) => j.status === "Booked" || j.status === "In Progress" || j.status === "Awaiting Approval",
  );
  const repeatCustomers = jobs
    .reduce<Record<string, number>>((acc, j) => {
      acc[j.customer] = (acc[j.customer] ?? 0) + 1;
      return acc;
    }, {});
  const repeats = Object.entries(repeatCustomers)
    .filter(([, n]) => n >= 2)
    .map(([name, n]) => ({ name, count: n }));

  const upcomingValue = upcomingJobs.reduce((s, j) => s + j.priceQuoted, 0);
  const sentQuoteValue = sentQuotes.reduce((s, q) => s + q.price, 0);
  const projectedMonth = upcomingValue + acceptedQuotes.reduce((s, q) => s + q.price, 0);

  const projection = monthlyRevenue.map((m) => ({ month: m.month, revenue: m.revenue }));
  // Add a forecast point
  projection.push({ month: "May (forecast)", revenue: Math.round(projectedMonth * 1.05) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi
          label="Booked Pipeline"
          value={gbp(upcomingValue)}
          trend={`${upcomingJobs.length} jobs`}
          up
          accent="success"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Kpi
          label="Quotes Likely to Convert"
          value={gbp(sentQuoteValue)}
          trend={`${sentQuotes.length} quotes`}
          up
          icon={<Receipt className="h-4 w-4" />}
        />
        <Kpi
          label="Projected Next Month"
          value={gbp(projectedMonth)}
          trend="Based on current pipeline"
          up
          accent="success"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">6-Month Revenue Trend + Forecast</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
                formatter={(v: number) => gbp(v)}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Repeat Customer Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {repeats.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.count} previous jobs — likely to rebook
                  </div>
                </div>
                <Badge variant="secondary">High value</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Slow Months Watch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              December historically dips to <strong>{gbp(7200)}</strong>. Push winter
              boiler-service campaigns by mid-November to lift revenue.
            </p>
            <p className="text-sm">
              Quote follow-ups: {sentQuotes.length} quotes still open. Following up could unlock{" "}
              <strong>{gbp(sentQuoteValue)}</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================== Snapshots ================== */

function SnapshotsPanel({
  metrics,
}: {
  metrics: {
    revenueMonth: number;
    paidTotal: number;
    outstanding: number;
    netProfit: number;
    forecast30: number;
    conversionRate: number;
    quotesPendingValue: number;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Beautiful at-a-glance cards — screenshot for meetings, partners or your accountant.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => toast.success("Exporting all snapshots…", { description: "PDF bundle generation (demo)." })}
        >
          <Download className="h-3.5 w-3.5" /> Export all
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SnapCard
          title="Today's Financial Position"
          tone="primary"
          stats={[
            { label: "Cash in this month", value: gbp(metrics.paidTotal) },
            { label: "Outstanding", value: gbp(metrics.outstanding) },
            { label: "Net profit", value: gbp(metrics.netProfit) },
          ]}
        />
        <SnapCard
          title="Monthly Revenue Snapshot"
          tone="dark"
          stats={[
            { label: "This month", value: gbp(metrics.revenueMonth) },
            { label: "Target", value: gbp(TARGET_MONTHLY) },
            {
              label: "Progress",
              value: `${Math.round((metrics.revenueMonth / TARGET_MONTHLY) * 100)}%`,
            },
          ]}
        />
        <SnapCard
          title="Outstanding Money Owed"
          tone="warning"
          stats={[
            { label: "Awaiting payment", value: gbp(metrics.outstanding) },
            {
              label: "Invoices",
              value: `${jobs.filter((j) => j.status === "Invoiced").length} open`,
            },
            { label: "Oldest", value: "8 days" },
          ]}
        />
        <SnapCard
          title="Jobs Completed vs Revenue"
          tone="success"
          stats={[
            {
              label: "Jobs paid",
              value: `${jobs.filter((j) => j.status === "Paid").length}`,
            },
            { label: "Revenue", value: gbp(metrics.paidTotal) },
            {
              label: "Avg job",
              value: gbp(
                metrics.paidTotal /
                  Math.max(1, jobs.filter((j) => j.status === "Paid").length),
              ),
            },
          ]}
        />
        <SnapCard
          title="Lead Conversion Performance"
          tone="primary"
          stats={[
            { label: "Conversion", value: `${metrics.conversionRate}%` },
            { label: "Pending value", value: gbp(metrics.quotesPendingValue) },
            { label: "Total quotes", value: `${quotes.length}` },
          ]}
        />
        <SnapCard
          title="Upcoming Revenue Pipeline"
          tone="success"
          stats={[
            { label: "Forecast (30d)", value: gbp(metrics.forecast30) },
            {
              label: "Booked jobs",
              value: `${jobs.filter((j) => j.status === "Booked" || j.status === "In Progress").length}`,
            },
            {
              label: "Accepted quotes",
              value: `${quotes.filter((q) => q.status === "Accepted").length}`,
            },
          ]}
        />
      </div>
    </div>
  );
}

function SnapCard({
  title,
  stats,
  tone,
}: {
  title: string;
  stats: { label: string; value: string }[];
  tone: "primary" | "dark" | "warning" | "success";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const toneClass =
    tone === "primary"
      ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
      : tone === "dark"
        ? "bg-gradient-to-br from-sidebar to-sidebar/80 text-sidebar-foreground"
        : tone === "warning"
          ? "bg-gradient-to-br from-warning/90 to-warning/60 text-foreground"
          : "bg-gradient-to-br from-success to-success/70 text-success-foreground";

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div ref={ref} className={cn("p-6 relative", toneClass)}>
        <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest opacity-70">
          Steady Works HQ
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="text-[11px] uppercase tracking-widest opacity-80 mt-0.5">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-[10px] uppercase tracking-widest opacity-70">{s.label}</div>
              <div className="text-xl font-bold tabular-nums mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <CardContent className="p-3 flex items-center justify-end gap-2 bg-card">
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs"
          onClick={() => toast.success(`Screenshot ready: ${title}`, { description: "Image saved to your downloads (demo)." })}
        >
          <Camera className="h-3.5 w-3.5" /> Screenshot
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => {
            const text = `${title}\n${stats.map((s) => `${s.label}: ${s.value}`).join("\n")}`;
            navigator.clipboard?.writeText(text);
            toast.success("Snapshot copied to clipboard");
          }}
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </CardContent>
    </Card>
  );
}
