import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  TrendingUp,
  TrendingDown,
  Target,
  PoundSterling,
  Users,
  Zap,
  AlertTriangle,
  Sparkles,
  Plus,
  Trophy,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { AppShell } from "@/components/AppShell";
import {
  marketingSpend as seedSpend,
  leads as seedLeads,
  gbp,
  type LeadSource,
  type MarketingSpend,
  type Lead,
} from "@/lib/mock-data";

export const Route = createFileRoute("/marketing")({
  component: MarketingPage,
});

const ALL_SOURCES: LeadSource[] = [
  "Facebook Ads",
  "Google Ads",
  "Instagram",
  "Leaflets",
  "Referral",
  "Repeat Customer",
  "Organic",
  "Website",
  "Cold Outreach",
  "Local Directory",
  "Other",
];

interface SourceMetric {
  source: LeadSource;
  spend: number;
  leads: number;
  won: number;
  lost: number;
  pending: number;
  revenue: number;
  conversion: number; // %
  cpl: number;
  cpa: number;
  rpl: number;
  roi: number; // %
  score: number; // 0-100
}

function computeMetrics(spend: MarketingSpend[], leads: Lead[]): SourceMetric[] {
  const sources = Array.from(new Set([...spend.map(s => s.source), ...leads.map(l => l.source)]));
  return sources.map((source) => {
    const sSpend = spend.filter(s => s.source === source).reduce((a, b) => a + b.amount, 0);
    const sLeads = leads.filter(l => l.source === source);
    const won = sLeads.filter(l => l.status === "Won").length;
    const lost = sLeads.filter(l => l.status === "Lost").length;
    const pending = sLeads.filter(l => l.status === "Pending").length;
    const revenue = sLeads.reduce((a, b) => a + b.revenue, 0);
    const total = sLeads.length;
    const conversion = total ? (won / total) * 100 : 0;
    const cpl = total && sSpend ? sSpend / total : 0;
    const cpa = won && sSpend ? sSpend / won : 0;
    const rpl = total ? revenue / total : 0;
    const roi = sSpend ? ((revenue - sSpend) / sSpend) * 100 : revenue > 0 ? 999 : 0;
    // Score: weighted blend of conversion, ROI, revenue.
    const convScore = Math.min(100, conversion * 1.3);
    const roiScore = sSpend ? Math.max(0, Math.min(100, 50 + roi / 20)) : 80;
    const revScore = Math.min(100, (revenue / 50));
    const score = Math.round(convScore * 0.35 + roiScore * 0.4 + revScore * 0.25);
    return { source, spend: sSpend, leads: total, won, lost, pending, revenue, conversion, cpl, cpa, rpl, roi, score };
  }).sort((a, b) => b.score - a.score);
}

function scoreColor(score: number) {
  if (score >= 70) return "bg-success text-success-foreground";
  if (score >= 45) return "bg-warning/30 text-foreground border border-warning/50";
  return "bg-destructive text-destructive-foreground";
}

function scoreLabel(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 45) return "OK";
  return "Weak";
}

function MarketingPage() {
  const [spend, setSpend] = useState<MarketingSpend[]>(seedSpend);
  const [leads] = useState<Lead[]>(seedLeads);
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [openAdd, setOpenAdd] = useState(false);

  // form
  const [fSource, setFSource] = useState<LeadSource>("Facebook Ads");
  const [fCampaign, setFCampaign] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fNotes, setFNotes] = useState("");

  const metrics = useMemo(() => computeMetrics(spend, leads), [spend, leads]);

  const totals = useMemo(() => {
    const totalSpend = spend.reduce((a, b) => a + b.amount, 0);
    const totalLeads = leads.length;
    const totalWon = leads.filter(l => l.status === "Won").length;
    const totalRevenue = leads.reduce((a, b) => a + b.revenue, 0);
    const conversion = totalLeads ? (totalWon / totalLeads) * 100 : 0;
    const cpl = totalLeads ? totalSpend / totalLeads : 0;
    const cpa = totalWon ? totalSpend / totalWon : 0;
    const rpl = totalLeads ? totalRevenue / totalLeads : 0;
    const roi = totalSpend ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    return { totalSpend, totalLeads, totalWon, totalRevenue, conversion, cpl, cpa, rpl, roi };
  }, [spend, leads]);

  const best = metrics[0];
  const worst = [...metrics].filter(m => m.spend > 0).sort((a, b) => a.score - b.score)[0];
  const expensive = [...metrics].filter(m => m.spend > 50 && m.score < 50).sort((a, b) => b.cpa - a.cpa)[0];

  // Funnel data
  const funnel = useMemo(() => [
    { stage: "Leads", count: leads.length },
    { stage: "Engaged", count: leads.filter(l => l.status !== "Lost").length },
    { stage: "Won", count: leads.filter(l => l.status === "Won").length },
  ], [leads]);

  // Spend vs Revenue weekly (last 4 weeks)
  const spendVsRev = useMemo(() => {
    const buckets = [0, 1, 2, 3].map(i => ({ week: `W${4 - i}`, spend: 0, revenue: 0 }));
    const now = new Date();
    spend.forEach(s => {
      const days = Math.floor((now.getTime() - new Date(s.date).getTime()) / 86400000);
      const wk = Math.min(3, Math.floor(days / 7));
      buckets[wk].spend += s.amount;
    });
    leads.forEach(l => {
      const days = Math.floor((now.getTime() - new Date(l.date).getTime()) / 86400000);
      const wk = Math.min(3, Math.floor(days / 7));
      buckets[wk].revenue += l.revenue;
    });
    return buckets.reverse();
  }, [spend, leads]);

  // CPL over time per source (for top 3)
  const cplTrend = useMemo(() => {
    const top = metrics.slice(0, 3).map(m => m.source);
    const buckets = [0, 1, 2, 3].map(i => {
      const row: Record<string, number | string> = { week: `W${4 - i}` };
      top.forEach(src => {
        const wkSpend = spend.filter(s => {
          const days = Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000);
          return s.source === src && Math.floor(days / 7) === i;
        }).reduce((a, b) => a + b.amount, 0);
        const wkLeads = leads.filter(l => {
          const days = Math.floor((Date.now() - new Date(l.date).getTime()) / 86400000);
          return l.source === src && Math.floor(days / 7) === i;
        }).length;
        row[src] = wkLeads ? +(wkSpend / wkLeads).toFixed(0) : 0;
      });
      return row;
    });
    return { data: buckets.reverse(), keys: top };
  }, [metrics, spend, leads]);

  const filteredSpend = sourceFilter === "all" ? spend : spend.filter(s => s.source === sourceFilter);
  const filteredLeads = sourceFilter === "all" ? leads : leads.filter(l => l.source === sourceFilter);

  const alerts = useMemo(() => {
    const out: { tone: "warn" | "danger"; text: string }[] = [];
    metrics.forEach(m => {
      if (m.spend > 100 && m.cpa > 200 && m.won > 0) {
        out.push({ tone: "warn", text: `${m.source}: cost per acquisition is high (${gbp(m.cpa)}).` });
      }
      if (m.spend > 80 && m.won === 0) {
        out.push({ tone: "danger", text: `${m.source}: ${gbp(m.spend)} spent with zero conversions — pause & review.` });
      }
      if (m.spend > 100 && m.roi < -20) {
        out.push({ tone: "danger", text: `${m.source}: ROI is ${m.roi.toFixed(0)}% — losing money.` });
      }
    });
    return out.slice(0, 4);
  }, [metrics]);

  const submitSpend = () => {
    const amt = parseFloat(fAmount);
    if (!fCampaign.trim() || !amt) {
      toast.error("Add a campaign name and amount.");
      return;
    }
    const entry: MarketingSpend = {
      id: `ms-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      source: fSource,
      campaign: fCampaign.trim(),
      amount: amt,
      notes: fNotes.trim() || undefined,
    };
    setSpend(prev => [entry, ...prev]);
    toast.success(`Logged ${gbp(amt)} on ${fSource}.`);
    setFCampaign(""); setFAmount(""); setFNotes("");
    setOpenAdd(false);
  };

  return (
    <AppShell>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Marketing Performance Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track every penny spent. See exactly what's printing money — and what's wasting it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as LeadSource | "all")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {ALL_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Log Spend</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log marketing spend</DialogTitle>
                <DialogDescription>Track every campaign so we can measure ROI properly.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Source / platform</Label>
                  <Select value={fSource} onValueChange={(v) => setFSource(v as LeadSource)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Campaign name</Label>
                  <Input value={fCampaign} onChange={(e) => setFCampaign(e.target.value)} placeholder="e.g. April Boiler Push" />
                </div>
                <div>
                  <Label>Amount (£)</Label>
                  <Input type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} placeholder="120" />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Targeting, creative, audience…" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                <Button onClick={submitSpend}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={PoundSterling} label="Total spend" value={gbp(totals.totalSpend)} tone="muted" />
        <Kpi icon={Users} label="Leads" value={totals.totalLeads.toString()} tone="muted" />
        <Kpi icon={Target} label="Conversion" value={`${totals.conversion.toFixed(0)}%`} tone={totals.conversion >= 40 ? "good" : "warn"} />
        <Kpi icon={Zap} label="Cost per lead" value={gbp(totals.cpl)} tone="muted" />
        <Kpi icon={TrendingUp} label="Revenue" value={gbp(totals.totalRevenue)} tone="good" />
        <Kpi icon={Flame} label="ROI" value={`${totals.roi.toFixed(0)}%`} tone={totals.roi >= 100 ? "good" : totals.roi >= 0 ? "warn" : "danger"} />
      </div>

      {/* Insight panel */}
      <div className="grid md:grid-cols-3 gap-3">
        <InsightCard
          tone="good"
          icon={Trophy}
          title="Best lead source"
          source={best?.source ?? "—"}
          line={best ? `${best.won} wins · ${gbp(best.revenue)} revenue · score ${best.score}` : ""}
        />
        <InsightCard
          tone="warn"
          icon={Sparkles}
          title="Highest ROI channel"
          source={[...metrics].sort((a, b) => b.roi - a.roi)[0]?.source ?? "—"}
          line={`${[...metrics].sort((a, b) => b.roi - a.roi)[0]?.roi.toFixed(0) ?? 0}% return on spend`}
        />
        <InsightCard
          tone="danger"
          icon={TrendingDown}
          title="Wasted spend"
          source={expensive?.source ?? worst?.source ?? "—"}
          line={
            expensive
              ? `CPA ${gbp(expensive.cpa)} — consider pausing.`
              : worst ? `Score ${worst.score} — needs attention.` : "Nothing critical."
          }
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="spend">Spend log</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Spend vs Revenue</CardTitle>
                <CardDescription>Last 4 weeks — money in vs money out from marketing.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={spendVsRev}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => gbp(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="spend" stroke="hsl(var(--destructive))" fill="url(#spendGrad)" name="Spend" />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="url(#revGrad)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead funnel</CardTitle>
                <CardDescription>Top of funnel → wins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {funnel.map((f, i) => {
                  const pct = funnel[0].count ? (f.count / funnel[0].count) * 100 : 0;
                  return (
                    <div key={f.stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{f.stage}</span>
                        <span className="text-muted-foreground">{f.count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <Progress value={pct} className={i === 2 ? "[&>div]:bg-success" : ""} />
                    </div>
                  );
                })}
                <div className="pt-2 border-t mt-2 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Cost per acquisition</span><span className="font-mono font-semibold">{gbp(totals.cpa)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Revenue per lead</span><span className="font-mono font-semibold">{gbp(totals.rpl)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost per lead — trending</CardTitle>
                <CardDescription>Top 3 channels over the last 4 weeks.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={cplTrend.data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="week" />
                    <YAxis tickFormatter={(v) => `£${v}`} />
                    <Tooltip formatter={(v: number) => gbp(v)} />
                    <Legend />
                    {cplTrend.keys.map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k}
                        stroke={["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))"][i]}
                        strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alerts</CardTitle>
                <CardDescription>Auto-flagged based on spend, conversion and ROI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.length === 0 && (
                  <div className="text-sm text-muted-foreground py-6 text-center">All channels healthy. Nothing to fix.</div>
                )}
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-md border text-sm flex items-start gap-2 ${
                      a.tone === "danger"
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-warning/10 border-warning/30 text-foreground"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{a.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CHANNELS */}
        <TabsContent value="channels" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Intelligence Score</CardTitle>
              <CardDescription>Traffic-light ranking by spend efficiency, conversion & revenue.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Won</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map(m => (
                    <TableRow key={m.source}>
                      <TableCell className="font-medium">{m.source}</TableCell>
                      <TableCell className="text-right font-mono">{gbp(m.spend)}</TableCell>
                      <TableCell className="text-right">{m.leads}</TableCell>
                      <TableCell className="text-right">{m.won}</TableCell>
                      <TableCell className="text-right">{m.conversion.toFixed(0)}%</TableCell>
                      <TableCell className="text-right font-mono">{m.cpl ? gbp(m.cpl) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{m.cpa ? gbp(m.cpa) : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{gbp(m.revenue)}</TableCell>
                      <TableCell className={`text-right font-mono ${m.roi >= 100 ? "text-success" : m.roi < 0 ? "text-destructive" : ""}`}>
                        {m.spend ? `${m.roi.toFixed(0)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={scoreColor(m.score)}>{m.score} · {scoreLabel(m.score)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by channel</CardTitle>
              <CardDescription>Where the money actually came from.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.filter(m => m.revenue > 0 || m.spend > 0).map(m => ({ name: m.source, Revenue: m.revenue, Spend: m.spend }))}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" angle={-20} textAnchor="end" height={70} interval={0} fontSize={11} />
                  <YAxis tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(v: number) => gbp(v)} />
                  <Legend />
                  <Bar dataKey="Spend" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPEND LOG */}
        <TabsContent value="spend" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Spend log</CardTitle>
                <CardDescription>{filteredSpend.length} entries · {gbp(filteredSpend.reduce((a, b) => a + b.amount, 0))} total</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpend.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm text-muted-foreground">{s.date}</TableCell>
                      <TableCell><Badge variant="outline">{s.source}</Badge></TableCell>
                      <TableCell className="font-medium">{s.campaign}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.notes || "—"}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{gbp(s.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSpend.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No spend logged for this filter.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADS */}
        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>{filteredLeads.length} leads tracked · {filteredLeads.filter(l => l.status === "Won").length} won</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm text-muted-foreground">{l.date}</TableCell>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell><Badge variant="outline">{l.source}</Badge></TableCell>
                      <TableCell>
                        <Badge className={
                          l.status === "Won" ? "bg-success text-success-foreground" :
                          l.status === "Lost" ? "bg-destructive text-destructive-foreground" :
                          "bg-warning/30 text-foreground border border-warning/50"
                        }>{l.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{l.revenue ? gbp(l.revenue) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AppShell>
  );
}

function Kpi({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "good" | "warn" | "danger" | "muted";
}) {
  const toneClass =
    tone === "good" ? "text-success" :
    tone === "warn" ? "text-warning" :
    tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className={`text-xl md:text-2xl font-bold mt-1 ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  tone, icon: Icon, title, source, line,
}: {
  tone: "good" | "warn" | "danger";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  source: string;
  line: string;
}) {
  const bg =
    tone === "good" ? "bg-gradient-to-br from-success/15 to-success/5 border-success/30" :
    tone === "warn" ? "bg-gradient-to-br from-warning/15 to-warning/5 border-warning/30" :
    "bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/30";
  const ic =
    tone === "good" ? "text-success" :
    tone === "warn" ? "text-warning" : "text-destructive";
  return (
    <Card className={`${bg} border`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          <Icon className={`h-4 w-4 ${ic}`} />
          {title}
        </div>
        <div className="text-2xl font-bold mt-2">{source}</div>
        <div className="text-sm text-muted-foreground mt-1">{line}</div>
      </CardContent>
    </Card>
  );
}
