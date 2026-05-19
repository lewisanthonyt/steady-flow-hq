import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Users as UsersIcon, Plus, ChevronLeft, Trash2, Crown, Shield, Mail } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

type Role = "Owner" | "Admin" | "Manager" | "Engineer" | "Office" | "Viewer";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: "Active" | "Invited" | "Disabled";
}

const initial: UserRow[] = [
  {
    id: "U-001",
    name: "Boss",
    email: "boss@steadyworks.co.uk",
    phone: "+44 7700 900100",
    role: "Owner",
    status: "Active",
  },
];

const roleColor: Record<Role, string> = {
  Owner: "bg-primary text-primary-foreground",
  Admin: "bg-foreground text-background",
  Manager: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  Engineer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  Office: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Viewer: "bg-muted text-muted-foreground",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Engineer" as Role,
  });

  const submit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    const next: UserRow = {
      id: `U-${String(users.length + 1).padStart(3, "0")}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      status: "Invited",
    };
    setUsers((prev) => [...prev, next]);
    setForm({ name: "", email: "", phone: "", role: "Engineer" });
    setOpen(false);
    toast.success(`Invite sent to ${next.email}`);
  };

  const changeRole = (id: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    toast.success("Role updated.");
  };

  const remove = (id: string, isOwner: boolean) => {
    if (isOwner) {
      toast.error("You can't remove the Owner account.");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("User removed.");
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
              <UsersIcon className="h-7 w-7 text-primary" /> Users & Team Access
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Invite staff, contractors and office team. You stay the Owner.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a new user</DialogTitle>
                <DialogDescription>They'll get an email to set their password.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v) => setForm({ ...form, role: v as Role })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Engineer">Engineer</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@steadyworks.co.uk"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone (optional)</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+44…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit}>Send Invite</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {users.map((u) => {
              const isOwner = u.role === "Owner";
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-muted/30"
                >
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold shrink-0">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{u.name}</div>
                      {isOwner && <Crown className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {u.email}
                      {u.phone && <span className="ml-2">· {u.phone}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {u.status}
                  </Badge>
                  {isOwner ? (
                    <Badge className={roleColor[u.role]}>
                      <Crown className="h-3 w-3 mr-1" /> Owner
                    </Badge>
                  ) : (
                    <Select
                      value={u.role}
                      onValueChange={(v) => changeRole(u.id, v as Role)}
                    >
                      <SelectTrigger className={`h-8 w-[130px] ${roleColor[u.role]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Engineer">Engineer</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isOwner}
                    onClick={() => remove(u.id, isOwner)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Role permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div><span className="font-medium text-foreground">Owner</span> — full access, billing, cannot be removed.</div>
            <div><span className="font-medium text-foreground">Admin</span> — manage staff, finance, settings.</div>
            <div><span className="font-medium text-foreground">Manager</span> — jobs, customers, quotes, scheduling.</div>
            <div><span className="font-medium text-foreground">Engineer</span> — view assigned jobs, update status, log time.</div>
            <div><span className="font-medium text-foreground">Office</span> — CRM, quotes, invoices.</div>
            <div><span className="font-medium text-foreground">Viewer</span> — read-only dashboard.</div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
