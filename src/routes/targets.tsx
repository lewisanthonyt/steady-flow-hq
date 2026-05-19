import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Home, Target, Plus, Trash2, Pencil, TrendingUp, Save, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/targets")({ component: TargetsPage });

type Period = "weekly" | "monthly" | "quarterly" | "yearly";
type Category = "revenue" | "jobs" | "quotes" | "leads" | "profit" | "custom";

type TargetItem = {
  id: string;
  name: string;
  category: Category;
  period: Period;
  goal: number;
  actual: number;
  unit: string; // £ or count
  note?: string;
};

const KEY = "sw_targets_v1";

const DEFAULTS: TargetItem[] = [
  { id: "t1", name: "Monthly Revenue", category: "revenue", period: "monthly", goal: 40000, actual: 27450, unit: "£" },
  { id: "t2", name: "Jobs Completed", category: "jobs", period: "monthly", goal: 60, actual: 42, unit: "count" },
  { id: "t3", name: "Quotes Sent", category: "quotes", period: "weekly", goal: 20, actual: 14, unit: "count" },
  { id: "t4", name: "New Leads", category: "leads", period: "monthly", goal: 120, actual: 88, unit: "count" },
  { id: "t5", name: "Gross Profit", category: "profit", period: "quarterly", goal: 75000, actual: 51200, unit: "£" },
];

function fmt(v: number, unit: string) {
  if (unit === "£") return "£" + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toLocaleString();
}

function TargetsPage() {
  const [items, setItems] = useState<TargetItem[]>(DEFAULTS);
  const [filter, setFilter] = useState<Period | "all">("all");
  const [editing, setEditing] = useState<TargetItem | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const filtered = useMemo(
    () => filter === "all" ? items : items.filter(i => i.period === filter),
    [items, filter]
  );

  const summary = useMemo(() => {
    const total = items.length;
    const hit = items.filter(i => i.actual >= i.goal).length;
    const avg = items.length
      ? Math.round(items.reduce((s, i) => s + Math.min(100, (i.actual / Math.max(1, i.goal)) * 100), 0) / items.length)
      : 0;
    return { total, hit, avg };
  }, [items]);

  function save(t: TargetItem) {
    setItems(prev => {
      const exists = prev.some(p => p.id === t.id);
      return exists ? prev.map(p => p.id === t.id ? t : p) : [t, ...prev];
    });
    toast.success(editing ? "Target updated" : "Target created");
    setEditing(null);
    setCreating(false);
  }

  function remove(id: string) {
    setItems(prev => prev.filter(p => p.id !== id));
    toast.success("Target removed");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="flex items-center gap-1 hover:text-foreground">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Targets</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" /> Targets & Goals
            </h1>
            <p className="text-muted-foreground mt-1">Set, adjust and track your business targets across every period.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as Period | "all")}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All periods</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Target
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Active targets</CardDescription>
              <CardTitle className="text-3xl">{summary.total}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Goals hit</CardDescription>
              <CardTitle className="text-3xl">{summary.hit}<span className="text-base text-muted-foreground"> / {summary.total}</span></CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Avg. completion</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">{summary.avg}%
                <TrendingUp className="h-5 w-5 text-primary" /></CardTitle></CardHeader>
          </Card>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const pct = Math.min(100, Math.round((t.actual / Math.max(1, t.goal)) * 100));
            const hit = t.actual >= t.goal;
            return (
              <Card key={t.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize">{t.period}</Badge>
                        <Badge variant="outline" className="capitalize">{t.category}</Badge>
                        {hit && <Badge className="bg-primary text-primary-foreground">On target</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{fmt(t.actual, t.unit)}</div>
                    <div className="text-sm text-muted-foreground">of {fmt(t.goal, t.unit)}</div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct}% complete</span>
                    <span>{Math.max(0, t.goal - t.actual) > 0 ? `${fmt(t.goal - t.actual, t.unit)} to go` : "Goal hit"}</span>
                  </div>
                  {t.note && <p className="text-xs text-muted-foreground border-t pt-2">{t.note}</p>}

                  {/* Quick adjust */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground shrink-0">Update actual</Label>
                    <Input
                      type="number"
                      value={t.actual}
                      onChange={(e) => setItems(prev => prev.map(p => p.id === t.id ? { ...p, actual: Number(e.target.value) || 0 } : p))}
                      className="h-8"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card className="md:col-span-2"><CardContent className="py-12 text-center text-muted-foreground">
              No targets in this period. Click <strong>New Target</strong> to add one.
            </CardContent></Card>
          )}
        </div>
      </div>

      <TargetDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        initial={editing}
        onSave={save}
      />
    </AppShell>
  );
}

function TargetDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: TargetItem | null;
  onSave: (t: TargetItem) => void;
}) {
  const [form, setForm] = useState<TargetItem>(
    initial ?? { id: crypto.randomUUID(), name: "", category: "revenue", period: "monthly", goal: 0, actual: 0, unit: "£" }
  );

  useEffect(() => {
    setForm(initial ?? { id: crypto.randomUUID(), name: "", category: "revenue", period: "monthly", goal: 0, actual: 0, unit: "£" });
  }, [initial, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit target" : "Set a new target"}</DialogTitle>
          <DialogDescription>Define the goal, period and current progress.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Revenue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="quotes">Quotes</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as Period })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="£">£ (currency)</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Goal</Label>
              <Input type="number" value={form.goal} onChange={(e) => setForm({ ...form, goal: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Actual</Label>
              <Input type="number" value={form.actual} onChange={(e) => setForm({ ...form, actual: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Context, owner, motivation…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
          <Button onClick={() => {
            if (!form.name.trim()) { toast.error("Name is required"); return; }
            if (form.goal <= 0) { toast.error("Goal must be greater than 0"); return; }
            onSave(form);
          }}>
            <Save className="h-4 w-4 mr-1" /> Save target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
