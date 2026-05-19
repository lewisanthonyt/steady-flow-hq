import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Briefcase, Calendar as CalendarIcon, CheckCircle2, Clock, FileText,
  Image as ImageIcon, MapPin, MessageSquare, Paperclip, Phone, Plus, Receipt,
  Send, Trash2, Upload, User as UserIcon, Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gbp, statusColor, STATUS_ORDER, type JobStatus } from "@/lib/mock-data";
import {
  useJobsStore, addQuote, updateQuoteStatus, convertQuoteToInvoice, addInvoice,
  recordPayment, addFile, removeFile, addNote, addTask, toggleTask, setJobStatus,
  jobTotals, type JobInvoice,
} from "@/lib/jobs-store";

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job — Steady Works HQ" }] }),
  component: JobWorkspacePage,
});

function JobWorkspacePage() {
  const { jobId } = Route.useParams();
  const store = useJobsStore();
  const navigate = useNavigate();
  const job = store.jobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold">Job not found</h1>
          <p className="text-muted-foreground mt-2">It may have been deleted or the link is wrong.</p>
          <Button asChild className="mt-4"><Link to="/jobs">Back to Jobs</Link></Button>
        </div>
      </AppShell>
    );
  }

  const t = jobTotals(job);
  const customer = store.customers.find((c) => c.id === job.customerId);

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <Link to="/jobs" className="hover:text-foreground">Jobs</Link>
              <span>/</span>
              <span className="font-mono font-semibold text-foreground">{job.id}</span>
            </nav>
            <Button variant="ghost" size="sm" className="-ml-2 mb-2 gap-1.5" onClick={() => navigate({ to: "/jobs" })}>
              <ArrowLeft className="h-3.5 w-3.5" /> All jobs
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight font-mono">{job.id}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(job.status)}`}>{job.status}</span>
              {job.priority !== "Normal" && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/15 text-warning-foreground border border-warning/30">{job.priority}</span>
              )}
            </div>
            <div className="text-muted-foreground mt-1">{job.jobType} · {job.customerName}</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={job.status} onValueChange={(v) => setJobStatus(job.id, v as JobStatus)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_ORDER.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Quoted" value={gbp(t.quoted)} />
          <StatCard label="Invoiced" value={gbp(t.invoiced)} />
          <StatCard label="Paid" value={gbp(t.paid)} accent="success" />
          <StatCard label="Outstanding" value={gbp(t.outstanding)} accent={t.outstanding > 0 ? "danger" : "muted"} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">Quotes ({job.quotes.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({job.invoices.length})</TabsTrigger>
            <TabsTrigger value="files">Files ({job.files.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({job.notes.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({job.tasks.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Job details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row icon={Briefcase} label="Job type" value={job.jobType} />
                  <Row icon={MapPin} label="Address" value={job.address || "—"} />
                  <Row icon={UserIcon} label="Assigned" value={job.assignedStaff} />
                  <Row icon={CalendarIcon} label="Due" value={job.dueDate ? new Date(job.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                  <Row icon={Clock} label="Created" value={new Date(job.createdAt).toLocaleString("en-GB")} />
                  {job.description && (
                    <div className="pt-3 border-t">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</div>
                      <div className="whitespace-pre-line">{job.description}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Link to="/customers/$customerId" params={{ customerId: job.customerId }} className="font-semibold text-base hover:underline block">
                    {job.customerName}
                  </Link>
                  {customer?.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {customer.phone}</div>}
                  {customer?.email && <div className="flex items-center gap-2 text-muted-foreground truncate"><MessageSquare className="h-3.5 w-3.5" /> {customer.email}</div>}
                  {customer?.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {customer.address}</div>}
                  <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                    <Link to="/customers/$customerId" params={{ customerId: job.customerId }}>View customer profile</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quotes" className="mt-4"><QuotesTab job={job} /></TabsContent>
          <TabsContent value="invoices" className="mt-4"><InvoicesTab job={job} /></TabsContent>
          <TabsContent value="files" className="mt-4"><FilesTab job={job} /></TabsContent>
          <TabsContent value="notes" className="mt-4"><NotesTab job={job} /></TabsContent>
          <TabsContent value="tasks" className="mt-4"><TasksTab job={job} /></TabsContent>
          <TabsContent value="activity" className="mt-4"><ActivityTab job={job} /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "success" | "danger" | "muted" }) {
  const cls = accent === "success" ? "text-success" : accent === "danger" ? "text-destructive" : accent === "muted" ? "text-muted-foreground" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold tabular-nums mt-1 ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

// ============= Tabs =============
type J = ReturnType<typeof useJobsStore>["jobs"][number];

function QuotesTab({ job }: { job: J }) {
  const [open, setOpen] = useState(false);
  const [work, setWork] = useState(job.description ?? "");
  const [price, setPrice] = useState(500);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New quote</Button>
      </div>
      {job.quotes.length === 0 ? (
        <EmptyState icon={FileText} title="No quotes yet" hint="Create the first quote for this job." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {job.quotes.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-sm">{q.number}</div>
                    <div className="text-xs text-muted-foreground">Rev {q.revision} · {new Date(q.createdAt).toLocaleDateString("en-GB")}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${q.status === "Accepted" ? "bg-success text-success-foreground" : q.status === "Sent" ? "bg-warning/15 text-warning-foreground border border-warning/30" : "bg-muted text-muted-foreground"}`}>{q.status}</span>
                </div>
                <div className="text-sm whitespace-pre-line line-clamp-3">{q.work}</div>
                <div className="flex items-end justify-between pt-2 border-t">
                  <div className="text-2xl font-bold tabular-nums">{gbp(q.price)}</div>
                  <div className="flex gap-1">
                    {q.status === "Draft" && (
                      <Button size="sm" variant="outline" onClick={() => { updateQuoteStatus(job.id, q.id, "Sent"); toast.success(`${q.number} marked sent`); }}>
                        <Send className="h-3.5 w-3.5 mr-1" />Send
                      </Button>
                    )}
                    {q.status !== "Accepted" && (
                      <Button size="sm" variant="outline" onClick={() => { updateQuoteStatus(job.id, q.id, "Accepted"); toast.success(`${q.number} accepted`); }}>
                        Accept
                      </Button>
                    )}
                    <Button size="sm" onClick={() => { const inv = convertQuoteToInvoice(job.id, q.id); if (inv) toast.success(`${inv.number} created from ${q.number}`); }}>
                      <Receipt className="h-3.5 w-3.5 mr-1" />Convert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New quote</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Work description</Label><Textarea rows={4} value={work} onChange={(e) => setWork(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Price (£)</Label><Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { const q = addQuote(job.id, { work, price }); if (q) { toast.success(`${q.number} created`); setOpen(false); } }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoicesTab({ job }: { job: J }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [kind, setKind] = useState<JobInvoice["kind"]>("Final");
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<"Card" | "Bank Transfer" | "Cash" | "Cheque" | "Other">("Bank Transfer");

  const payInvoice = job.invoices.find((i) => i.id === payOpen);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> New invoice</Button>
      </div>
      {job.invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" hint="Convert a quote, or create one manually." />
      ) : (
        <div className="space-y-3">
          {job.invoices.map((i) => {
            const paid = i.payments.reduce((s, p) => s + p.amount, 0);
            const outstanding = i.amount - paid;
            return (
              <Card key={i.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{i.number}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{i.kind}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${i.status === "Paid" ? "bg-success text-success-foreground" : i.status === "Part Paid" ? "bg-warning/20 text-foreground border border-warning/40" : "bg-secondary text-secondary-foreground"}`}>{i.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Due {new Date(i.dueDate).toLocaleDateString("en-GB")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold tabular-nums">{gbp(i.amount)}</div>
                      <div className="text-xs text-muted-foreground">Paid {gbp(paid)} · Outstanding {gbp(outstanding)}</div>
                    </div>
                  </div>
                  {i.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {i.payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{new Date(p.date).toLocaleDateString("en-GB")} · {p.method}</span>
                          <span className="font-semibold tabular-nums">{gbp(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {outstanding > 0 && (
                    <div className="flex justify-end mt-3">
                      <Button size="sm" onClick={() => { setPayOpen(i.id); setPayAmount(outstanding); }}>
                        <Wallet className="h-3.5 w-3.5 mr-1" /> Record payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as JobInvoice["kind"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Deposit", "Interim", "Final"].map((k) => (<SelectItem key={k} value={k}>{k}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Amount (£)</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { const inv = addInvoice(job.id, { kind, amount }); if (inv) { toast.success(`${inv.number} created`); setOpen(false); setAmount(0); } }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen !== null} onOpenChange={(v) => !v && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record payment · {payInvoice?.number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Amount (£)</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} /></div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as typeof payMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Card", "Bank Transfer", "Cash", "Cheque", "Other"].map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(null)}>Cancel</Button>
            <Button onClick={() => { if (payOpen) { recordPayment(job.id, payOpen, { date: new Date().toISOString().slice(0, 10), amount: payAmount, method: payMethod }); toast.success(`Payment ${gbp(payAmount)} recorded`); setPayOpen(null); } }}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilesTab({ job }: { job: J }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 1_500_000) {
        toast.error(`${file.name} too large (max 1.5MB demo cap)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        const kind = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : file.type.startsWith("video/") ? "video" : "other";
        addFile(job.id, { name: file.name, kind, url, size: file.size });
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} file(s) uploaded`);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        <div className="mt-2 font-semibold">Drop files here</div>
        <div className="text-xs text-muted-foreground">Photos, PDFs, receipts, site images</div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <Button variant="outline" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
          <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Browse files
        </Button>
      </div>
      {job.files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {job.files.map((f) => (
            <motion.div key={f.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="overflow-hidden group relative">
                {f.kind === "image" ? (
                  <img src={f.url} alt={f.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="h-32 flex items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2">
                  <div className="text-xs font-semibold truncate">{f.name}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(f.uploadedAt).toLocaleDateString("en-GB")}</div>
                </div>
                <button onClick={() => removeFile(job.id, f.id)} className="absolute top-1 right-1 h-7 w-7 rounded-md bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ job }: { job: J }) {
  const [body, setBody] = useState("");
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-3 space-y-2">
          <Textarea rows={3} placeholder="Add a note about this job…" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { if (body.trim()) { addNote(job.id, body.trim()); setBody(""); toast.success("Note added"); } }}>Add note</Button>
          </div>
        </CardContent>
      </Card>
      {job.notes.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No notes yet" hint="Drop a thought, voice the client, or log a callout." />
      ) : (
        <div className="space-y-2">
          {job.notes.map((n) => (
            <Card key={n.id}><CardContent className="p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold text-foreground">{n.author}</span>
                <span>{new Date(n.createdAt).toLocaleString("en-GB")}</span>
              </div>
              <div className="text-sm whitespace-pre-line">{n.body}</div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab({ job }: { job: J }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("Tom");
  const [dueDate, setDueDate] = useState("");
  return (
    <div className="space-y-3">
      <Card><CardContent className="p-3">
        <div className="grid md:grid-cols-[1fr_140px_160px_auto] gap-2">
          <Input placeholder="Task title…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Tom", "Jay", "Boss", "Unassigned"].map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
          </Select>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button onClick={() => { if (title.trim()) { addTask(job.id, { title: title.trim(), assignee, dueDate: dueDate || undefined }); setTitle(""); toast.success("Task added"); } }}>Add</Button>
        </div>
      </CardContent></Card>
      {job.tasks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No tasks yet" hint="Add materials pickup, callbacks, or site checks." />
      ) : (
        <div className="space-y-1.5">
          {job.tasks.map((t) => (
            <Card key={t.id}><CardContent className="p-3 flex items-center gap-3">
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(job.id, t.id)} className="h-4 w-4 accent-primary" />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.assignee}{t.dueDate ? " · due " + new Date(t.dueDate).toLocaleDateString("en-GB") : ""}</div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityTab({ job }: { job: J }) {
  const events = useMemo(() => [...job.activity].sort((a, b) => +new Date(b.at) - +new Date(a.at)), [job.activity]);
  return (
    <Card><CardContent className="p-4">
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
        {events.map((e) => (
          <div key={e.id} className="relative pb-4 last:pb-0">
            <div className="absolute -left-[18px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
            <div className="text-sm">{e.message}</div>
            <div className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString("en-GB")}</div>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint: string }) {
  return (
    <Card><CardContent className="p-10 text-center">
      <Icon className="h-8 w-8 mx-auto text-muted-foreground" />
      <div className="font-semibold mt-2">{title}</div>
      <div className="text-sm text-muted-foreground">{hint}</div>
    </CardContent></Card>
  );
}
