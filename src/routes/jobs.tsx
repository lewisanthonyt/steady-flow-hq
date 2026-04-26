import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Calendar as CalendarIcon, LayoutGrid, List as ListIcon, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jobs, gbp, statusColor, STATUS_ORDER, type JobStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — Steady Works HQ" },
      { name: "description", content: "Track every job from lead to paid." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const [view, setView] = useState<"list" | "kanban" | "calendar">("kanban");

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobs Board</h1>
            <p className="text-muted-foreground mt-1">{jobs.length} jobs across the pipeline.</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => toast.success("New Job started", { description: "Opens the job builder (demo)." })}
          >
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2"><LayoutGrid className="h-4 w-4" /> Kanban</TabsTrigger>
            <TabsTrigger value="list" className="gap-2"><ListIcon className="h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2"><CalendarIcon className="h-4 w-4" /> Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <KanbanView />
          </TabsContent>
          <TabsContent value="list" className="mt-4">
            <ListView />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function KanbanView() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
      {STATUS_ORDER.map((status) => {
        const colJobs = jobs.filter((j) => j.status === status);
        return (
          <div key={status} className="min-w-[260px] w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor(status as JobStatus)}`}>
                {status}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">{colJobs.length}</span>
            </div>
            <div className="space-y-2">
              {colJobs.map((j, i) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wide">{j.jobType}</div>
                      <div className="font-medium text-sm mt-1">{j.customer}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{j.description}</div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs">
                        <span className="text-muted-foreground">
                          {new Date(j.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="font-bold tabular-nums">{j.priceQuoted ? gbp(j.priceQuoted) : "—"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {colJobs.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  No jobs
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView() {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Job</th>
              <th className="text-left p-3">Staff</th>
              <th className="text-right p-3">Price</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t hover:bg-muted/30">
                <td className="p-3 text-muted-foreground tabular-nums">
                  {new Date(j.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </td>
                <td className="p-3 font-medium">{j.customer}</td>
                <td className="p-3">{j.jobType}</td>
                <td className="p-3 text-muted-foreground">{j.assignedStaff}</td>
                <td className="p-3 text-right font-semibold tabular-nums">{j.priceQuoted ? gbp(j.priceQuoted) : "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(j.status)}`}>{j.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CalendarView() {
  // Simple month grid
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const jobsForDay = (d: number) => {
    const iso = new Date(year, month, d).toISOString().slice(0, 10);
    return jobs.filter((j) => j.date === iso);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs uppercase tracking-wider text-muted-foreground mb-2">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="p-2 text-center font-semibold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            const isToday = c.day === now.getDate();
            const dayJobs = c.day ? jobsForDay(c.day) : [];
            return (
              <div
                key={i}
                className={`min-h-[90px] rounded-md border p-1.5 text-xs ${c.day ? "bg-card" : "bg-muted/20"} ${isToday ? "border-primary border-2" : ""}`}
              >
                {c.day && (
                  <>
                    <div className={`text-right font-semibold ${isToday ? "text-primary" : ""}`}>{c.day}</div>
                    <div className="space-y-0.5 mt-1">
                      {dayJobs.slice(0, 2).map((j) => (
                        <div key={j.id} className="truncate px-1 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                          {j.time} {j.customer.split(" ")[0]}
                        </div>
                      ))}
                      {dayJobs.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">+{dayJobs.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
