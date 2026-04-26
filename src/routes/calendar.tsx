import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildCalendarItems, calendarTypeColor, type CalendarItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Steady Works HQ" },
      { name: "description", content: "Master calendar — jobs, tasks, quotes, invoices and meetings." },
    ],
  }),
  component: CalendarPage,
});

const TYPES: CalendarItem["type"][] = ["Job", "Task", "Quote", "Invoice", "Meeting", "Compliance"];

function CalendarPage() {
  const items = useMemo(() => buildCalendarItems(), []);
  const [cursor, setCursor] = useState(() => new Date());
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TYPES.map((t) => [t, true])),
  );

  const visible = items.filter((i) => enabled[i.type]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Calendar</h1>
            <p className="text-muted-foreground mt-1">Jobs, tasks, quotes, invoices and meetings — one view.</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              toast.info("Google Calendar sync", {
                description: "Connect Lovable Cloud to enable two-way sync.",
              })
            }
          >
            <ExternalLink className="h-4 w-4" /> Connect Google Calendar
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-2">SHOWING</span>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setEnabled((e) => ({ ...e, [t]: !e[t] }))}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-semibold transition-opacity",
                  calendarTypeColor(t),
                  !enabled[t] && "opacity-30 grayscale",
                )}
              >
                {t}
              </button>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="month">
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="month" className="mt-4">
            <MonthView cursor={cursor} setCursor={setCursor} items={visible} />
          </TabsContent>
          <TabsContent value="week" className="mt-4">
            <WeekView cursor={cursor} setCursor={setCursor} items={visible} />
          </TabsContent>
          <TabsContent value="day" className="mt-4">
            <DayView cursor={cursor} setCursor={setCursor} items={visible} />
          </TabsContent>
          <TabsContent value="agenda" className="mt-4">
            <AgendaView items={visible} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Header({ label, onPrev, onNext, onToday }: { label: string; onPrev: () => void; onNext: () => void; onToday: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold">{label}</h2>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onToday}>Today</Button>
        <Button variant="outline" size="icon" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function MonthView({ cursor, setCursor, items }: { cursor: Date; setCursor: (d: Date) => void; items: CalendarItem[] }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = new Date().toISOString().slice(0, 10);

  const cells: ({ date: Date; iso: string } | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date, iso: date.toISOString().slice(0, 10) });
  }
  while (cells.length % 7) cells.push(null);

  return (
    <Card>
      <CardContent className="p-4">
        <Header
          label={cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          onPrev={() => setCursor(new Date(year, month - 1, 1))}
          onNext={() => setCursor(new Date(year, month + 1, 1))}
          onToday={() => setCursor(new Date())}
        />
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-muted/60 text-[10px] uppercase tracking-wider font-bold text-muted-foreground py-2 text-center">{d}</div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={i} className="bg-muted/20 min-h-[110px]" />;
            const dayItems = items.filter((it) => it.date === c.iso);
            const isToday = c.iso === todayISO;
            return (
              <div key={i} className={cn("bg-card min-h-[110px] p-1.5 flex flex-col gap-1", isToday && "ring-2 ring-primary ring-inset")}>
                <div className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-foreground")}>{c.date.getDate()}</div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayItems.slice(0, 3).map((it) => (
                    <div key={it.id} className={cn("text-[10px] px-1.5 py-0.5 rounded truncate font-medium", calendarTypeColor(it.type))} title={it.title}>
                      {it.time ? `${it.time} ` : ""}{it.title}
                    </div>
                  ))}
                  {dayItems.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayItems.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WeekView({ cursor, setCursor, items }: { cursor: Date; setCursor: (d: Date) => void; items: CalendarItem[] }) {
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardContent className="p-4">
        <Header
          label={`Week of ${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          onPrev={() => { const d = new Date(cursor); d.setDate(d.getDate() - 7); setCursor(d); }}
          onNext={() => { const d = new Date(cursor); d.setDate(d.getDate() + 7); setCursor(d); }}
          onToday={() => setCursor(new Date())}
        />
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const list = items.filter((it) => it.date === iso).sort((a,b) => (a.time || "").localeCompare(b.time || ""));
            const isToday = iso === todayISO;
            return (
              <div key={iso} className={cn("rounded-lg border p-2 min-h-[260px]", isToday ? "border-primary bg-primary/5" : "bg-card")}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-xs font-bold uppercase", isToday && "text-primary")}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                  <span className="text-sm font-bold">{d.getDate()}</span>
                </div>
                <div className="space-y-1">
                  {list.map((it) => (
                    <div key={it.id} className={cn("text-[11px] px-1.5 py-1 rounded font-medium", calendarTypeColor(it.type))}>
                      {it.time && <div className="font-bold">{it.time}</div>}
                      <div className="leading-tight">{it.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DayView({ cursor, setCursor, items }: { cursor: Date; setCursor: (d: Date) => void; items: CalendarItem[] }) {
  const iso = cursor.toISOString().slice(0, 10);
  const list = items.filter((it) => it.date === iso).sort((a,b) => (a.time || "23:59").localeCompare(b.time || "23:59"));
  return (
    <Card>
      <CardContent className="p-4">
        <Header
          label={cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          onPrev={() => { const d = new Date(cursor); d.setDate(d.getDate() - 1); setCursor(d); }}
          onNext={() => { const d = new Date(cursor); d.setDate(d.getDate() + 1); setCursor(d); }}
          onToday={() => setCursor(new Date())}
        />
        <div className="space-y-2">
          {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Nothing scheduled.</p>}
          {list.map((it) => (
            <div key={it.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40">
              <div className="w-16 shrink-0 text-sm font-bold tabular-nums">{it.time ?? "—"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{it.title}</div>
                {it.subtitle && <div className="text-xs text-muted-foreground">{it.subtitle}</div>}
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", calendarTypeColor(it.type))}>{it.type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaView({ items }: { items: CalendarItem[] }) {
  const sorted = [...items].sort((a,b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const grouped: Record<string, CalendarItem[]> = {};
  sorted.forEach((it) => { (grouped[it.date] ||= []).push(it); });
  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {Object.entries(grouped).map(([date, list]) => (
          <div key={date} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold">{new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h3>
            </div>
            <div className="space-y-1.5">
              {list.map((it) => (
                <div key={it.id} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-xs text-muted-foreground tabular-nums">{it.time ?? "—"}</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", calendarTypeColor(it.type))}>{it.type}</span>
                  <span className="font-medium">{it.title}</span>
                  {it.subtitle && <span className="text-xs text-muted-foreground truncate">· {it.subtitle}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
