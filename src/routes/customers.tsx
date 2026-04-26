import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, MapPin, FileText, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customers, jobs, gbp } from "@/lib/mock-data";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Steady Works HQ" },
      { name: "description", content: "Customer relationships and history." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(customers[0].id);
  const [query, setQuery] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.email.toLowerCase().includes(query.toLowerCase()) ||
    c.address.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = customers.find((c) => c.id === selectedId)!;
  const customerJobs = jobs.filter((j) => j.customerId === selected.id);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-1">{customers.length} contacts in your CRM.</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => toast.success("New customer", { description: "Add Customer form (demo)." })}
          >
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-4">
          {/* List */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedId === c.id ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selectedId === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {c.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{c.name}</div>
                        <div className={`text-xs truncate ${selectedId === c.id ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
                          {c.jobsCount} jobs · {gbp(c.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detail */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                      {selected.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selected.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        Last contacted {new Date(selected.lastContacted).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href={`tel:${selected.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href={`mailto:${selected.email}`}><Mail className="h-3.5 w-3.5" /> Email</a>
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        toast.success(`Starting quote for ${selected.name}`);
                        navigate({ to: "/quotes" });
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" /> New Quote
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <Stat label="Total Revenue" value={gbp(selected.totalRevenue)} />
                  <Stat label="Total Jobs" value={String(selected.jobsCount)} />
                  <Stat label="Avg Job Value" value={gbp(Math.round(selected.totalRevenue / Math.max(1, selected.jobsCount)))} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-6 text-sm">
                  <Info icon={Phone} label="Phone" value={selected.phone} />
                  <Info icon={Mail} label="Email" value={selected.email} />
                  <Info icon={MapPin} label="Address" value={selected.address} className="sm:col-span-2" />
                </div>

                {selected.notes && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-md text-sm">
                    <span className="font-semibold">Notes: </span>{selected.notes}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Job History ({customerJobs.length})</h3>
                </div>
                {customerJobs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No jobs yet.</div>
                ) : (
                  <div className="divide-y">
                    {customerJobs.map((j) => (
                      <div key={j.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/30">
                        <div>
                          <div className="font-medium">{j.jobType}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(j.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {j.assignedStaff}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold tabular-nums">{j.priceQuoted ? gbp(j.priceQuoted) : "—"}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{j.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Info({
  icon: Icon, label, value, className,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-start gap-2 ${className ?? ""}`}>
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
