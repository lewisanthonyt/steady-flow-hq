import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Receipt,
  FileText,
  Search,
  Plus,
  Bell,
  ListTodo,
  CalendarDays,
  UserPlus,
  Bell as BellIcon,
  HardHat,
  LineChart,
} from "lucide-react";
import logo from "@/assets/steadyworks-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/finance", label: "Finance", icon: Receipt },
  { to: "/accounts", label: "Accounts", icon: LineChart },
  { to: "/quotes", label: "Quotes", icon: FileText },
] as const;

const quickAdd = [
  { label: "New Job", icon: Briefcase, to: "/jobs", desc: "Schedule work for a customer" },
  { label: "New Task", icon: ListTodo, to: "/tasks", desc: "Add a to-do or reminder" },
  { label: "New Quote", icon: FileText, to: "/quotes", desc: "Build & send a quote" },
  { label: "New Customer", icon: UserPlus, to: "/customers", desc: "Add to your CRM" },
  { label: "New Invoice", icon: Receipt, to: "/finance", desc: "Bill a completed job" },
  { label: "New Contractor", icon: HardHat, to: "/customers", desc: "Add a subcontractor" },
  { label: "New Reminder", icon: BellIcon, to: "/tasks", desc: "Set a calendar reminder" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info(`Searching for "${searchQuery}"…`, { description: "Try Customers or Jobs for full results." });
    navigate({ to: "/customers" });
    setSearchQuery("");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src={logo} alt="Steady Works" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight">STEADY WORKS</div>
            <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">HQ Console</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
              SW
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Boss</div>
              <div className="text-xs text-sidebar-foreground/60">Owner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 md:px-8 h-16">
            <div className="md:hidden flex items-center gap-2">
              <img src={logo} alt="Steady Works" className="h-8 w-8 object-contain" />
              <span className="font-bold text-sm">STEADY WORKS</span>
            </div>
            <form onSubmit={onSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, customers, quotes…"
                  className="pl-9 bg-muted/50 border-transparent"
                />
              </div>
            </form>
            <div className="ml-auto flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="px-4 py-3 border-b">
                    <div className="font-semibold text-sm">Notifications</div>
                    <div className="text-xs text-muted-foreground">3 new today</div>
                  </div>
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {[
                      { t: "Quote SW-1043 accepted", d: "Margaret Thompson · 2h ago", icon: FileText },
                      { t: "Invoice paid · £820", d: "John Carter · 5h ago", icon: Receipt },
                      { t: "New booking: Boiler service", d: "Tomorrow 09:00 · Bolton", icon: Briefcase },
                    ].map((n, i) => (
                      <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/40 cursor-pointer">
                        <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <n.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-tight">{n.t}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{n.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => toast.success("All caught up.")}>
                      Mark all as read
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" /> Quick Add
                  </Button>
                </DialogTrigger>
                <QuickAddContent onPick={() => setOpen(false)} />
              </Dialog>
            </div>
          </div>
          {/* Mobile nav */}
          <nav className="md:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
                    active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
      </div>

      {/* Floating Quick Add (mobile) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="md:hidden fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full shadow-2xl"
            aria-label="Quick Add"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <QuickAddContent onPick={() => setOpen(false)} />
      </Dialog>
    </div>
  );
}

function QuickAddContent({ onPick }: { onPick: () => void }) {
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Quick Add</DialogTitle>
        <DialogDescription>Create something new in one tap.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {quickAdd.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.label}
              to={q.to}
              onClick={onPick}
              className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{q.label}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{q.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </DialogContent>
  );
}
