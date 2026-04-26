import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Line, LineChart,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, PoundSterling, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { jobs, expenses, monthlyRevenue, gbp } from "@/lib/mock-data";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance — Steady Works HQ" },
      { name: "description", content: "Income, expenses and profit at a glance." },
    ],
  }),
  component: FinancePage,
});

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

function FinancePage() {
  const thisMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const profit = thisMonth.revenue - thisMonth.expenses;
  const outstanding = jobs.filter(j => j.status === "Invoiced").reduce((s, j) => s + j.finalInvoice, 0);
  const bestMonth = monthlyRevenue.reduce((m, c) => c.revenue > m.revenue ? c : m);

  const expenseByCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const profitTrend = monthlyRevenue.map((m) => ({ month: m.month, profit: m.revenue - m.expenses }));

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
            <p className="text-muted-foreground mt-1">Income, expenses and outstanding payments.</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => toast.success("Log Expense", { description: "Expense form (demo)." })}
          >
            <Plus className="h-4 w-4" /> Log Expense
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FinKpi label="Money In (Apr)" value={gbp(thisMonth.revenue)} icon={ArrowUpRight} positive />
          <FinKpi label="Money Out (Apr)" value={gbp(thisMonth.expenses)} icon={ArrowDownRight} />
          <FinKpi label="Net Profit" value={gbp(profit)} icon={PoundSterling} accent />
          <FinKpi label="Outstanding" value={gbp(outstanding)} icon={ArrowUpRight} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Profit Trend</CardTitle>
              <span className="text-xs text-muted-foreground">Best month: <span className="font-semibold text-foreground">{bestMonth.month} ({gbp(bestMonth.revenue)})</span></span>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitTrend} margin={{ left: -10, right: 10, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `£${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => gbp(v)}
                  />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-chart-1)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-chart-1)" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => gbp(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Expenses (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `£${v/1000}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => gbp(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6,6,0,0]} name="Revenue" />
                <Bar dataKey="expenses" fill="var(--color-chart-2)" radius={[6,6,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Income</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {jobs.filter(j => j.status === "Paid" || j.status === "Invoiced").slice(0, 6).map((j) => (
                  <div key={j.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{j.customer}</div>
                      <div className="text-xs text-muted-foreground">{j.jobType} · {new Date(j.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-success tabular-nums">+{gbp(j.finalInvoice)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{j.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {expenses.slice(0, 6).map((e) => (
                  <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{e.description}</div>
                      <div className="text-xs text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                    </div>
                    <div className="font-bold text-destructive tabular-nums">-{gbp(e.amount)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function FinKpi({
  label, value, icon: Icon, positive, accent,
}: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  positive?: boolean; accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/40 shadow-md" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ? "bg-primary text-primary-foreground" : positive ? "bg-success/15 text-success" : "bg-muted text-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
