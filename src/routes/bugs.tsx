import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bug, Plus, ChevronLeft, Trash2, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/bugs")({
  component: BugsPage,
});

type Severity = "Low" | "Medium" | "High" | "Critical";
type Status = "Open" | "In Progress" | "Fixed" | "Won't Fix";

interface BugItem {
  id: string;
  title: string;
  description: string;
  page: string;
  severity: Severity;
  status: Status;
  createdAt: string;
}

const seed: BugItem[] = [
  {
    id: "BUG-001",
    title: "Quick Add doesn't close on mobile after tap",
    description: "Bottom-sheet quick add stays open after tapping a tile on iOS Safari.",
    page: "Global",
    severity: "Medium",
    status: "Open",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "BUG-002",
    title: "Invoice total rounds incorrectly with VAT",
    description: "£820 invoice shows £819.99 in PDF export.",
    page: "Finance",
    severity: "High",
    status: "In Progress",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const sevColor: Record<Severity, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  Critical: "bg-destructive/10 text-destructive",
};

const statusColor: Record<Status, string> = {
  Open: "bg-primary/10 text-primary",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Fixed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "Won't Fix": "bg-muted text-muted-foreground",
};

function BugsPage() {
  const [bugs, setBugs] = useState<BugItem[]>(seed);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    page: "",
    severity: "Medium" as Severity,
  });

  const stats = useMemo(() => {
    return {
      open: bugs.filter((b) => b.status === "Open").length,
      inProgress: bugs.filter((b) => b.status === "In Progress").length,
      fixed: bugs.filter((b) => b.status === "Fixed").length,
      critical: bugs.filter((b) => b.severity === "Critical" && b.status !== "Fixed").length,
    };
  }, [bugs]);

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Add a title for the bug.");
      return;
    }
    const next: BugItem = {
      id: `BUG-${String(bugs.length + 1).padStart(3, "0")}`,
      title: form.title.trim(),
      description: form.description.trim(),
      page: form.page.trim() || "Global",
      severity: form.severity,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
    setBugs((prev) => [next, ...prev]);
    setForm({ title: "", description: "", page: "", severity: "Medium" });
    setOpen(false);
    toast.success(`${next.id} logged.`);
  };

  const updateStatus = (id: string, status: Status) => {
    setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    toast.success(`Marked ${id} as ${status}.`);
  };

  const remove = (id: string) => {
    setBugs((prev) => prev.filter((b) => b.id !== id));
    toast.success(`Deleted ${id}.`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bug className="h-7 w-7 text-primary" /> Bug Tracker
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Log issues as you spot them. Fix them later, in order of priority.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Log Bug
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a new bug</DialogTitle>
                <DialogDescription>Capture the issue while it's fresh.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="What's broken?"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Steps to reproduce, expected vs actual…"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Page / Area</Label>
                    <Input
                      value={form.page}
                      onChange={(e) => setForm({ ...form, page: e.target.value })}
                      placeholder="e.g. Jobs, Finance"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Severity</Label>
                    <Select
                      value={form.severity}
                      onValueChange={(v) => setForm({ ...form, severity: v as Severity })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit}>Log Bug</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Open", value: stats.open, icon: Circle, color: "text-primary" },
            { label: "In Progress", value: stats.inProgress, icon: AlertTriangle, color: "text-blue-600" },
            { label: "Fixed", value: stats.fixed, icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-destructive" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-2xl font-bold mt-0.5">{s.value}</div>
                  </div>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Bugs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Page</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugs.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{b.title}</div>
                      {b.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {b.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {b.page}
                    </TableCell>
                    <TableCell>
                      <Badge className={sevColor[b.severity]} variant="secondary">
                        {b.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={b.status}
                        onValueChange={(v) => updateStatus(b.id, v as Status)}
                      >
                        <SelectTrigger className={`h-8 w-[140px] ${statusColor[b.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Fixed">Fixed</SelectItem>
                          <SelectItem value="Won't Fix">Won't Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {bugs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No bugs logged — looking clean!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
