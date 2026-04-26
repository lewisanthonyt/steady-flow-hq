import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Circle, Clock, Filter, ListTodo, Plus, Repeat, Sparkles, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { tasks as seed, TASK_STATUSES, type Task, priorityColor, taskStatusColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Steady Works HQ" },
      { name: "description", content: "Daily to-dos, reminders and team tasks." },
    ],
  }),
  component: TasksPage,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function TasksPage() {
  const [items, setItems] = useState<Task[]>(seed);
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState<string>("All");

  const filtered = useMemo(() => items.filter((t) => {
    const matchQ = !query || t.title.toLowerCase().includes(query.toLowerCase()) || (t.relatedTo ?? "").toLowerCase().includes(query.toLowerCase());
    const matchA = assignee === "All" || t.assignedTo === assignee;
    return matchQ && matchA;
  }), [items, query, assignee]);

  const assignees = ["All", ...Array.from(new Set(items.map((t) => t.assignedTo)))];

  const toggle = (id: string) =>
    setItems((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === "Completed" ? "To Do" : "Completed" } : t));

  const todayList = filtered.filter((t) => t.dueDate === todayISO() && t.status !== "Completed" && t.status !== "Cancelled");
  const overdueList = filtered.filter((t) => t.dueDate < todayISO() && t.status !== "Completed" && t.status !== "Cancelled");
  const upcomingList = filtered.filter((t) => t.dueDate > todayISO() && t.status !== "Completed" && t.status !== "Cancelled");
  const completedList = filtered.filter((t) => t.status === "Completed");

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Your daily to-dos, reminders and team workload.</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Due Today" value={todayList.length} icon={Clock} accent />
          <StatCard label="Overdue" value={overdueList.length} icon={Sparkles} danger />
          <StatCard label="Upcoming" value={upcomingList.length} icon={CalendarDays} />
          <StatCard label="Completed" value={completedList.length} icon={CheckCircle2} />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" className="pl-9" />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {assignees.map((a) => (
                <Button key={a} variant={assignee === a ? "default" : "outline"} size="sm" onClick={() => setAssignee(a)}>
                  <User className="h-3.5 w-3.5" /> {a}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="planner">
          <TabsList>
            <TabsTrigger value="planner"><Clock className="h-4 w-4 mr-1" /> Daily Planner</TabsTrigger>
            <TabsTrigger value="list"><ListTodo className="h-4 w-4 mr-1" /> List</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>

          {/* Daily Planner */}
          <TabsContent value="planner" className="mt-4">
            <div className="grid lg:grid-cols-3 gap-4">
              <PlannerColumn title="Overdue" items={overdueList} onToggle={toggle} tone="danger" />
              <PlannerColumn title="Today" items={todayList} onToggle={toggle} tone="accent" />
              <PlannerColumn title="Upcoming" items={upcomingList.slice(0, 8)} onToggle={toggle} />
            </div>
          </TabsContent>

          {/* List */}
          <TabsContent value="list" className="mt-4">
            <Card>
              <CardContent className="p-0 divide-y">
                {filtered.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggle} />
                ))}
                {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No tasks match.</div>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kanban */}
          <TabsContent value="kanban" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {TASK_STATUSES.map((status) => {
                const list = filtered.filter((t) => t.status === status);
                return (
                  <div key={status} className="rounded-lg bg-muted/40 border p-3 min-h-[200px]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{status}</h3>
                      <span className="text-xs font-semibold bg-background border rounded-full px-2 py-0.5">{list.length}</span>
                    </div>
                    <div className="space-y-2">
                      {list.map((t, i) => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="rounded-md bg-card border p-3 shadow-sm hover:shadow-md transition cursor-grab"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug">{t.title}</p>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap", priorityColor(t.priority))}>{t.priority}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {t.assignedTo}</span>
                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{t.dueTime ? ` · ${t.dueTime}` : ""}</span>
                            {t.repeat && t.repeat !== "None" && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> {t.repeat}</span>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Week */}
          <TabsContent value="week" className="mt-4">
            <WeekView items={filtered} onToggle={toggle} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon: Icon, accent, danger }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent?: boolean; danger?: boolean }) {
  return (
    <Card className={cn(accent && "border-primary/30", danger && value > 0 && "border-destructive/40")}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
          <p className={cn("text-2xl font-bold mt-1", danger && value > 0 && "text-destructive", accent && "text-primary")}>{value}</p>
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", accent ? "bg-primary text-primary-foreground" : danger && value > 0 ? "bg-destructive text-destructive-foreground" : "bg-muted")}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const done = task.status === "Completed";
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      <Checkbox checked={done} onCheckedChange={() => onToggle(task.id)} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>{task.title}</p>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", priorityColor(task.priority))}>{task.priority}</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", taskStatusColor(task.status))}>{task.status}</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {task.assignedTo}</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{task.dueTime ? ` · ${task.dueTime}` : ""}</span>
          {task.relatedTo && <span>· {task.relatedTo}</span>}
          {task.repeat && task.repeat !== "None" && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> {task.repeat}</span>}
        </div>
      </div>
    </div>
  );
}

function PlannerColumn({ title, items, onToggle, tone }: { title: string; items: Task[]; onToggle: (id: string) => void; tone?: "accent" | "danger" }) {
  return (
    <Card className={cn(tone === "accent" && "border-primary/40", tone === "danger" && items.length > 0 && "border-destructive/40")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className={cn(tone === "danger" && items.length > 0 && "text-destructive")}>{title}</span>
          <span className="text-xs font-bold bg-muted rounded-full px-2 py-0.5">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">Nothing here. Nice.</p>}
        {items.map((t) => (
          <div key={t.id} className="flex items-start gap-2 p-2 rounded-md border bg-card">
            <button onClick={() => onToggle(t.id)} className="mt-0.5 text-muted-foreground hover:text-primary">
              <Circle className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{t.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{t.assignedTo}</span>
                {t.dueTime && <span>· {t.dueTime}</span>}
                <span className={cn("ml-auto px-1.5 py-0.5 rounded font-bold", priorityColor(t.priority))}>{t.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeekView({ items, onToggle }: { items: Task[]; onToggle: (id: string) => void }) {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    return d;
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const list = items.filter((t) => t.dueDate === iso);
        const isToday = iso === todayISO();
        return (
          <Card key={iso} className={cn(isToday && "border-primary shadow-md")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center justify-between">
                <span className={cn(isToday && "text-primary")}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                <span className="text-xs">{d.getDate()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {list.length === 0 && <p className="text-[11px] text-muted-foreground">—</p>}
              {list.map((t) => (
                <button key={t.id} onClick={() => onToggle(t.id)} className="w-full text-left text-[11px] p-1.5 rounded border bg-card hover:bg-muted/50">
                  <div className="font-medium leading-tight">{t.title}</div>
                  {t.dueTime && <div className="text-muted-foreground mt-0.5">{t.dueTime}</div>}
                </button>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
