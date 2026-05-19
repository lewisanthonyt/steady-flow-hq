import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useJobsStore, globalSearch } from "@/lib/jobs-store";
import { NewJobDialog } from "@/components/NewJobDialog";
import { AnimatePresence, motion } from "framer-motion";
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
  Megaphone,
  Bug,
  Target,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Hammer,
  HeartHandshake,
  Wallet,
  TrendingUp,
  Settings2,
  Menu,
  Clock,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const dashboardItem: NavItem = { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard };

const groups: NavGroup[] = [
  {
    id: "operations",
    label: "Operations",
    icon: Hammer,
    items: [
      { to: "/jobs", label: "Jobs", icon: Briefcase },
      { to: "/tasks", label: "Tasks", icon: ListTodo },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    icon: HeartHandshake,
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/quotes", label: "Quotes", icon: FileText },
      { to: "/invoicing", label: "Invoicing", icon: Receipt },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: Wallet,
    items: [
      { to: "/finance", label: "Finance", icon: Receipt },
      { to: "/accounts", label: "Accounts", icon: LineChart },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    icon: TrendingUp,
    items: [
      { to: "/marketing", label: "Marketing", icon: Megaphone },
      { to: "/targets", label: "Targets", icon: Target },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Settings2,
    items: [
      { to: "/users", label: "Users", icon: UserPlus },
      { to: "/bugs", label: "Bugs", icon: Bug },
    ],
  },
];

const allNavItems: NavItem[] = [dashboardItem, ...groups.flatMap((g) => g.items)];

const quickAdd = [
  { label: "New Job", icon: Briefcase, to: "/jobs", desc: "Schedule work for a customer" },
  { label: "New Quote", icon: FileText, to: "/quotes", desc: "Build & send a quote" },
  { label: "New Invoice", icon: Receipt, to: "/invoicing", desc: "Bill a completed job" },
  { label: "New Customer", icon: UserPlus, to: "/customers", desc: "Add to your CRM" },
  { label: "New Task", icon: ListTodo, to: "/tasks", desc: "Add a to-do or reminder" },
  { label: "New Contractor", icon: HardHat, to: "/customers", desc: "Add a subcontractor" },
  { label: "New Reminder", icon: BellIcon, to: "/tasks", desc: "Set a calendar reminder" },
] as const;

const COLLAPSE_KEY = "sw_sidebar_collapsed_v1";
const GROUPS_KEY = "sw_sidebar_groups_v1";
const RECENT_KEY = "sw_sidebar_recent_v1";

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      // ignore
    }
  };
  return [value, set];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(COLLAPSE_KEY, false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Global search uses the jobs store
  const store = useJobsStore();
  const searchResults = useMemo(() => globalSearch(store, searchQuery), [store, searchQuery]);

  // Track recent pages (only after mount to avoid hydration mismatch)
  const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);
  useEffect(() => {
    if (!mounted) return;
    const path = location.pathname;
    const item = allNavItems.find((i) => path === i.to || path.startsWith(i.to + "/"));
    if (!item) return;
    setRecent([item.to, ...recent.filter((r) => r !== item.to)].slice(0, 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, mounted]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (searchResults.jobs.length > 0) {
      navigate({ to: "/jobs/$jobId", params: { jobId: searchResults.jobs[0].id } });
      setSearchQuery(""); setSearchOpen(false);
      return;
    }
    if (searchResults.customers.length > 0) {
      navigate({ to: "/customers/$customerId", params: { customerId: searchResults.customers[0].id } });
      setSearchQuery(""); setSearchOpen(false);
      return;
    }
    const hit = allNavItems.find((i) => i.label.toLowerCase().includes(q));
    if (hit) {
      navigate({ to: hit.to });
      setSearchQuery(""); setSearchOpen(false);
      return;
    }
    toast.info(`No matches for "${searchQuery}"`);
  };

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 256 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={cn(
            "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen overflow-hidden",
            sidebarWidth,
          )}
        >
          <SidebarInner
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            currentPath={location.pathname}
            recent={recent}
            onQuickAdd={() => setQuickOpen(true)}
          />
        </motion.aside>

        {/* Mobile sidebar (sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-sidebar-border">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarInner
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              currentPath={location.pathname}
              recent={recent}
              onQuickAdd={() => {
                setMobileOpen(false);
                setQuickOpen(true);
              }}
              onNavigate={() => setMobileOpen(false)}
              mobile
            />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
            <div className="flex items-center gap-3 px-4 md:px-8 h-16">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
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
                    placeholder="Search pages, jobs, customers…"
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

                <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm">
                      <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Quick Add</span>
                    </Button>
                  </DialogTrigger>
                  <QuickAddContent onPick={() => setQuickOpen(false)} />
                </Dialog>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
        </div>

        {/* Floating Quick Add (mobile) */}
        <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="md:hidden fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full shadow-2xl"
              aria-label="Quick Add"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <QuickAddContent onPick={() => setQuickOpen(false)} />
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function SidebarInner({
  collapsed,
  onToggleCollapse,
  currentPath,
  recent,
  onQuickAdd,
  onNavigate,
  mobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentPath: string;
  recent: string[];
  onQuickAdd: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const isActive = (to: string) => currentPath === to || currentPath.startsWith(to + "/");

  const initialOpen = useMemo(() => {
    const defaults: Record<string, boolean> = {};
    groups.forEach((g) => {
      defaults[g.id] = g.items.some((i) => isActive(i.to)) || ["operations", "clients"].includes(g.id);
    });
    return defaults;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [openGroups, setOpenGroups] = useLocalStorage<Record<string, boolean>>(GROUPS_KEY, initialOpen);

  // Filter
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();
  const matchItem = (i: NavItem) => !q || i.label.toLowerCase().includes(q);

  const recentItems = recent
    .map((r) => allNavItems.find((i) => i.to === r))
    .filter(Boolean) as NavItem[];

  return (
    <>
      {/* Logo / brand */}
      <div className={cn("flex items-center gap-3 border-b border-sidebar-border h-[68px] px-4", collapsed && "justify-center px-2")}>
        <img src={logo} alt="Steady Works" className="h-9 w-9 object-contain shrink-0" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="leading-tight min-w-0"
            >
              <div className="font-bold text-sm tracking-tight truncate">STEADY WORKS</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">HQ Console</div>
            </motion.div>
          )}
        </AnimatePresence>
        {!collapsed && !mobile && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && !mobile && (
        <button
          onClick={onToggleCollapse}
          className="mx-2 mt-2 h-8 rounded-md flex items-center justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      )}

      {/* Search filter */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="h-8 pl-7 text-xs bg-sidebar-accent/40 border-transparent focus-visible:ring-1 placeholder:text-sidebar-foreground/40 text-sidebar-foreground"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4">
        {/* Dashboard pinned */}
        <NavLeaf
          item={dashboardItem}
          active={isActive(dashboardItem.to)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        {/* Recent */}
        {!collapsed && recentItems.length > 1 && !q && (
          <div>
            <GroupHeader label="Recent" icon={Clock} />
            <div className="space-y-0.5 mt-1">
              {recentItems.slice(0, 3).map((i) => (
                <NavLeaf
                  key={"r-" + i.to}
                  item={i}
                  active={isActive(i.to)}
                  collapsed={false}
                  onNavigate={onNavigate}
                  dense
                />
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {groups.map((g) => {
          const filtered = g.items.filter(matchItem);
          if (q && filtered.length === 0) return null;
          const isOpen = q ? true : openGroups[g.id] ?? false;
          const groupActive = g.items.some((i) => isActive(i.to));

          if (collapsed) {
            return (
              <div key={g.id} className="space-y-1">
                {filtered.map((i) => (
                  <NavLeaf
                    key={i.to}
                    item={i}
                    active={isActive(i.to)}
                    collapsed
                    onNavigate={onNavigate}
                  />
                ))}
                <div className="mx-2 my-1 h-px bg-sidebar-border/60" />
              </div>
            );
          }

          return (
            <div key={g.id}>
              <button
                onClick={() => setOpenGroups({ ...openGroups, [g.id]: !isOpen })}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors",
                  groupActive ? "text-sidebar-foreground" : "text-sidebar-foreground/55 hover:text-sidebar-foreground",
                )}
              >
                <g.icon className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">{g.label}</span>
                <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-0.5 pl-1">
                      {filtered.map((i) => (
                        <NavLeaf
                          key={i.to}
                          item={i}
                          active={isActive(i.to)}
                          collapsed={false}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Quick add in sidebar */}
      <div className={cn("px-3 pb-2", collapsed && "px-2")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onQuickAdd}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:opacity-90"
                aria-label="Quick Add"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Quick Add</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onQuickAdd}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Quick Add
          </button>
        )}
      </div>

      {/* Sticky profile */}
      <div className={cn("border-t border-sidebar-border p-3", collapsed && "p-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
            SW
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">Boss</div>
              <div className="text-xs text-sidebar-foreground/60 truncate">Steady Works HQ</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function GroupHeader({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/55">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function NavLeaf({
  item,
  active,
  collapsed,
  onNavigate,
  dense,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "relative group flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
        collapsed ? "h-10 justify-center mx-1" : dense ? "px-2.5 py-1.5" : "px-2.5 py-2",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      {active && !collapsed && (
        <motion.span
          layoutId="active-pill"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-sidebar-primary-foreground/80"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary-foreground")} />
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
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
