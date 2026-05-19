import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, LayoutGrid, List as ListIcon, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gbp, statusColor, STATUS_ORDER, type JobStatus } from "@/lib/mock-data";
import { useJobsStore, jobTotals } from "@/lib/jobs-store";
import { NewJobDialog } from "@/components/NewJobDialog";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — Steady Works HQ" },
      { name: "description", content: "Every job in one workspace." },
    ],
  }),
  component: JobsPage,
});

type FilterPreset = "all" | "active" | "completed" | "unpaid" | "urgent";

function JobsPage() {
  const store = useJobsStore();
  const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [preset, setPreset] = useState<FilterPreset>("all");

  const filteredJobs = useMemo(() => {
    const term = q.trim().toLowerCase();
    return store.jobs.filter((j) => {
      if (term) {
        const hit = j.id.toLowerCase().includes(term)
          || j.customerName.toLowerCase().includes(term)
          || j.address.toLowerCase().includes(term)
          || j.jobType.toLowerCase().includes(term)
          || j.quotes.some((qu) => qu.number.toLowerCase().includes(term))
          || j.invoices.some((iv) => iv.number.toLowerCase().includes(term));
        if (!hit) return false;
      }
      if (preset === "active") return !["Paid", "Completed"].includes(j.status);
      if (preset === "completed") return ["Paid", "Completed"].includes(j.status);
      if (preset === "unpaid") return jobTotals(j).outstanding > 0;
      if (preset === "urgent") return j.priority === "Urgent" || j.priority === "High";
      return true;
    });
  }, [store.jobs, q, preset]);

  return (
    <AppShell>
      <div className="space-y-5 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground mt-1">{store.jobs.length} jobs · each one a complete workspace.</p>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search JOB-ID, customer, address, INV/Quote#…" className="pl-9" />
          </div>
          <Select value={preset} onValueChange={(v) => setPreset(v as FilterPreset)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="urgent">Urgent / High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2"><LayoutGrid className="h-4 w-4" /> Kanban</TabsTrigger>
            <TabsTrigger value="list" className="gap-2"><ListIcon className="h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2"><CalendarIcon className="h-4 w-4" /> Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <KanbanView jobs={filteredJobs} />
          </TabsContent>
          <TabsContent value="list" className="mt-4">
            <ListView jobs={filteredJobs} />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <CalendarView jobs={filteredJobs} />
          </TabsContent>
        </Tabs>
      </div>

      <NewJobDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

type J = ReturnType<typeof useJobsStore>["jobs"][number];

function KanbanView({ jobs }: { jobs: J[] }) {
  const navigate = useNavigate();
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
      {STATUS_ORDER.map((status) => {
        const colJobs = jobs.filter((j) => j.status === status);
        return (
          <div key={status} className="min-w-[260px] w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(status as JobStatus)}`}>{status}</span>
              <span className="text-xs text-muted-foreground font-semibold">{colJobs.length}</span>
            </div>
            <div className="space-y-2">
              {colJobs.map((j, i) => {
                const t = jobTotals(j);
                return (
                  <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all" onClick={() => navigate({ to: "/jobs/$jobId", params: { jobId: j.id } })}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-primary">{j.id}</span>
                          {j.priority === "Urgent" && <span className="text-[9px] font-bold uppercase text-destructive">Urgent</span>}
                        </div>
                        <div className="font-medium text-sm mt-1">{j.customerName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{j.jobType}</div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs">
                          <span className="text-muted-foreground">{j.dueDate ? new Date(j.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                          <span className="font-bold tabular-nums">{gbp(t.invoiced || t.quoted)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {colJobs.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">No jobs</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ jobs }: { jobs: J[] }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Job</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Due</th>
              <th className="text-right p-3">Total</th>
              <th className="text-right p-3">Outstanding</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const t = jobTotals(j);
              return (
                <tr key={j.id} className="border-t hover:bg-muted/30">
                  <td className="p-3"><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-mono text-xs font-bold text-primary hover:underline">{j.id}</Link></td>
                  <td className="p-3 font-medium">{j.customerName}</td>
                  <td className="p-3 text-muted-foreground">{j.jobType}</td>
                  <td className="p-3 text-muted-foreground tabular-nums">{j.dueDate ? new Date(j.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{gbp(t.invoiced || t.quoted)}</td>
                  <td className={`p-3 text-right tabular-nums ${t.outstanding > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{t.outstanding > 0 ? gbp(t.outstanding) : "—"}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(j.status)}`}>{j.status}</span></td>
                </tr>
              );
            })}
            {jobs.length === 0 && (<tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No jobs match your filters.</td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CalendarView({ jobs }: { jobs: J[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const jobsForDay = (d: number) => {
    const iso = new Date(year, month, d).toISOString().slice(0, 10);
    return jobs.filter((j) => j.dueDate === iso);
  };

  return (
    <Card><CardContent className="p-4">
      <h3 className="font-semibold mb-3">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h3>
      <div className="grid grid-cols-7 gap-1 text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (<div key={d} className="p-2 text-center font-semibold">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const isToday = c.day === now.getDate();
          const dayJobs = c.day ? jobsForDay(c.day) : [];
          return (
            <div key={i} className={`min-h-[90px] rounded-md border p-1.5 text-xs ${c.day ? "bg-card" : "bg-muted/20"} ${isToday ? "border-primary border-2" : ""}`}>
              {c.day && (<>
                <div className={`text-right font-semibold ${isToday ? "text-primary" : ""}`}>{c.day}</div>
                <div className="space-y-0.5 mt-1">
                  {dayJobs.slice(0, 2).map((j) => (
                    <Link key={j.id} to="/jobs/$jobId" params={{ jobId: j.id }} className="block truncate px-1 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20">
                      {j.customerName.split(" ")[0]} · {j.id}
                    </Link>
                  ))}
                  {dayJobs.length > 2 && (<div className="text-[10px] text-muted-foreground">+{dayJobs.length - 2} more</div>)}
                </div>
              </>)}
            </div>
          );
        })}
      </div>
    </CardContent></Card>
  );
}
