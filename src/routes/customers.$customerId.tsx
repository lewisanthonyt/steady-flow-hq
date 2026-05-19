import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, Mail, MapPin, Phone, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { gbp, statusColor } from "@/lib/mock-data";
import { useJobsStore, customerStats, jobTotals } from "@/lib/jobs-store";
import { NewJobDialog } from "@/components/NewJobDialog";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({ meta: [{ title: "Customer — Steady Works HQ" }] }),
  component: CustomerProfilePage,
});

function CustomerProfilePage() {
  const { customerId } = Route.useParams();
  const store = useJobsStore();
  const navigate = useNavigate();
  const [newJobOpen, setNewJobOpen] = useState(false);
  const customer = store.customers.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold">Customer not found</h1>
          <Button asChild className="mt-4"><Link to="/customers">Back to Customers</Link></Button>
        </div>
      </AppShell>
    );
  }

  const { jobs, lifetime, outstanding } = customerStats(store, customerId);
  const allActivity = jobs.flatMap((j) => j.activity.map((a) => ({ ...a, jobId: j.id })))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 20);

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={() => navigate({ to: "/customers" })}>
          <ArrowLeft className="h-3.5 w-3.5" /> All customers
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
              {customer.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{customer.email}</span>}
              {customer.address && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{customer.address}</span>}
            </div>
          </div>
          <Button onClick={() => setNewJobOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New job</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Jobs" value={String(jobs.length)} />
          <Stat label="Lifetime spend" value={gbp(lifetime)} accent="success" />
          <Stat label="Outstanding" value={gbp(outstanding)} accent={outstanding > 0 ? "danger" : "muted"} />
          <Stat label="Last contact" value={new Date(customer.lastContacted).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Jobs ({jobs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {jobs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">No jobs for this customer yet.</div>
              ) : jobs.map((j) => {
                const t = jobTotals(j);
                return (
                  <Link key={j.id} to="/jobs/$jobId" params={{ jobId: j.id }} className="block">
                    <div className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{j.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(j.status)}`}>{j.status}</span>
                        </div>
                        <div className="text-sm font-medium mt-0.5">{j.jobType}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-bold tabular-nums">{gbp(t.invoiced || t.quoted)}</div>
                        {t.outstanding > 0 && <div className="text-xs text-destructive">{gbp(t.outstanding)} due</div>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
            <CardContent>
              {allActivity.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">Nothing yet.</div>
              ) : (
                <div className="relative pl-5 space-y-3">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                  {allActivity.map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-[15px] top-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="text-xs font-mono text-muted-foreground">{e.jobId}</div>
                      <div className="text-sm">{e.message}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(e.at).toLocaleString("en-GB")}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} />
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "success" | "danger" | "muted" }) {
  const cls = accent === "success" ? "text-success" : accent === "danger" ? "text-destructive" : accent === "muted" ? "text-muted-foreground" : "";
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold tabular-nums mt-1 ${cls}`}>{value}</div>
    </CardContent></Card>
  );
}
