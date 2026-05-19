import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Receipt,
  Calculator,
  Plus,
  Trash2,
  Send,
  Download,
  Printer,
  Copy,
  Search,
  Eye,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { customers, gbp } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoicing")({
  head: () => ({
    meta: [
      { title: "Invoicing & Quotes — Steady Works HQ" },
      { name: "description", content: "Branded invoices, quotes & job estimator." },
    ],
  }),
  component: InvoicingPage,
});

type DocStatus = "Draft" | "Sent" | "Paid" | "Unpaid" | "Accepted" | "Rejected" | "Converted";

interface LineItem {
  id: string;
  kind: "Labour" | "Materials" | "Travel" | "Callout" | "Other";
  description: string;
  qty: number;
  unitPrice: number;
}

interface DocRecord {
  id: string;
  type: "Invoice" | "Quote";
  number: string;
  customer: string;
  customerEmail: string;
  customerAddress: string;
  date: string;
  due: string;
  items: LineItem[];
  vat: boolean;
  vatRate: number;
  notes: string;
  terms: string;
  status: DocStatus;
}

const BUSINESS = {
  name: "Steady Works",
  tagline: "Plumbing • Maintenance • Trades",
  email: "hello@steadyworkshq.online",
  phone: "0161 555 0142",
  website: "steadyworkshq.online",
  address: "Greater Manchester, UK",
};

const seed: DocRecord[] = [
  {
    id: "d1",
    type: "Invoice",
    number: "INV-1042",
    customer: "Margaret Thompson",
    customerEmail: "m.thompson@example.com",
    customerAddress: "14 Birch Avenue, Bolton, BL1 4PR",
    date: today(-5),
    due: today(9),
    items: [
      { id: "i1", kind: "Labour", description: "Boiler service & flush", qty: 4, unitPrice: 75 },
      { id: "i2", kind: "Materials", description: "Sealant, valve, filter", qty: 1, unitPrice: 64 },
    ],
    vat: true,
    vatRate: 20,
    notes: "Thanks for your business.",
    terms: "Payment due within 14 days. BACS preferred.",
    status: "Sent",
  },
  {
    id: "d2",
    type: "Invoice",
    number: "INV-1041",
    customer: "John Carter",
    customerEmail: "john@cartersltd.co.uk",
    customerAddress: "Unit 7 Brookside Trading Estate, Stockport",
    date: today(-12),
    due: today(-2),
    items: [
      { id: "i1", kind: "Callout", description: "Emergency leak — first hour", qty: 1, unitPrice: 100 },
      { id: "i2", kind: "Labour", description: "Additional repair hours", qty: 2, unitPrice: 65 },
    ],
    vat: true,
    vatRate: 20,
    notes: "",
    terms: "Payment on completion.",
    status: "Paid",
  },
  {
    id: "d3",
    type: "Quote",
    number: "QT-2051",
    customer: "Hannah Webb",
    customerEmail: "hannah.w@example.com",
    customerAddress: "22 Oakfield Road, Salford",
    date: today(-3),
    due: today(11),
    items: [
      { id: "i1", kind: "Labour", description: "Bathroom refit — 4 days", qty: 4, unitPrice: 300 },
      { id: "i2", kind: "Materials", description: "Tiles, fittings, plumbing", qty: 1, unitPrice: 1450 },
    ],
    vat: true,
    vatRate: 20,
    notes: "Quote valid for 14 days.",
    terms: "50% deposit on acceptance.",
    status: "Sent",
  },
  {
    id: "d4",
    type: "Quote",
    number: "QT-2050",
    customer: "Steven Patel",
    customerEmail: "s.patel@example.com",
    customerAddress: "8 The Crescent, Manchester",
    date: today(-1),
    due: today(13),
    items: [
      { id: "i1", kind: "Labour", description: "Garden tap install", qty: 3, unitPrice: 65 },
      { id: "i2", kind: "Materials", description: "Outside tap kit & pipework", qty: 1, unitPrice: 85 },
    ],
    vat: false,
    vatRate: 20,
    notes: "",
    terms: "Cash or BACS on completion.",
    status: "Draft",
  },
];

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function totals(doc: Pick<DocRecord, "items" | "vat" | "vatRate">) {
  const sub = doc.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = doc.vat ? sub * (doc.vatRate / 100) : 0;
  return { sub, vat, total: sub + vat };
}

// Deterministic, collision-proof document numbering.
// Format: {PREFIX}-{YYYYMM}-{NNN}  e.g. INV-202605-014, QT-202605-007
// Sequence resets each calendar month per type. Drafts reserve a number
// immediately and a uniqueness check guarantees no collision with existing docs.
function docPrefix(type: "Invoice" | "Quote") {
  return type === "Invoice" ? "INV" : "QT";
}

function periodKey(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nextDocNumber(
  existing: { type: "Invoice" | "Quote"; number: string }[],
  type: "Invoice" | "Quote",
  date = new Date(),
): string {
  const prefix = docPrefix(type);
  const period = periodKey(date);
  const re = new RegExp(`^${prefix}-${period}-(\\d{3,})$`);
  let maxSeq = 0;
  for (const d of existing) {
    if (d.type !== type) continue;
    const m = d.number.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSeq) maxSeq = n;
    }
  }
  let seq = maxSeq + 1;
  // Hard collision guard against any unexpected duplicate
  const taken = new Set(existing.map((d) => d.number));
  let candidate = `${prefix}-${period}-${String(seq).padStart(3, "0")}`;
  while (taken.has(candidate)) {
    seq += 1;
    candidate = `${prefix}-${period}-${String(seq).padStart(3, "0")}`;
  }
  return candidate;
}

function statusBadge(s: DocStatus) {
  const base = "px-2 py-0.5 rounded-full text-[10px] font-semibold border";
  switch (s) {
    case "Paid":
    case "Accepted":
      return `${base} bg-success/15 text-success-foreground border-success/30`;
    case "Sent":
      return `${base} bg-warning/15 text-warning-foreground border-warning/30`;
    case "Unpaid":
    case "Rejected":
      return `${base} bg-destructive/15 text-destructive border-destructive/30`;
    case "Converted":
      return `${base} bg-primary/10 text-primary border-primary/30`;
    default:
      return `${base} bg-muted text-muted-foreground border-border`;
  }
}

function InvoicingPage() {
  const [docs, setDocs] = useState<DocRecord[]>(seed);
  const [tab, setTab] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | DocStatus>("All");
  const [preview, setPreview] = useState<DocRecord | null>(null);
  const [editing, setEditing] = useState<DocRecord | null>(null);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (filter !== "All" && d.status !== filter) return false;
      const q = query.toLowerCase();
      if (!q) return true;
      return (
        d.number.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
    });
  }, [docs, query, filter]);

  const kpis = useMemo(() => {
    const invoices = docs.filter((d) => d.type === "Invoice");
    const paid = invoices.filter((d) => d.status === "Paid");
    const sent = invoices.filter((d) => d.status === "Sent" || d.status === "Unpaid");
    const drafts = docs.filter((d) => d.status === "Draft");
    const outstanding = sent.reduce((s, d) => s + totals(d).total, 0);
    const collected = paid.reduce((s, d) => s + totals(d).total, 0);
    return {
      outstanding,
      collected,
      drafts: drafts.length,
      quotes: docs.filter((d) => d.type === "Quote").length,
    };
  }, [docs]);

  function saveDoc(doc: DocRecord) {
    setDocs((d) => {
      const exists = d.find((x) => x.id === doc.id);
      return exists ? d.map((x) => (x.id === doc.id ? doc : x)) : [doc, ...d];
    });
  }

  function duplicate(doc: DocRecord) {
    const copy: DocRecord = {
      ...doc,
      id: crypto.randomUUID(),
      number: nextDocNumber(docs, doc.type),
      status: "Draft",
      date: today(),
    };
    setDocs((d) => [copy, ...d]);
    toast.success(`Duplicated as ${copy.number}.`);
  }

  function convertQuote(doc: DocRecord) {
    const inv: DocRecord = {
      ...doc,
      id: crypto.randomUUID(),
      type: "Invoice",
      number: nextDocNumber(docs, "Invoice"),
      status: "Draft",
      date: today(),
      due: today(14),
    };
    setDocs((d) => [inv, ...d.map((x) => (x.id === doc.id ? { ...x, status: "Converted" as DocStatus } : x))]);
    toast.success(`Quote ${doc.number} converted to ${inv.number}.`);
  }

  function setStatus(id: string, status: DocStatus) {
    setDocs((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  function remove(id: string) {
    setDocs((d) => d.filter((x) => x.id !== id));
    toast.success("Deleted.");
  }

  function newDraft(type: "Invoice" | "Quote") {
    const draft: DocRecord = {
      id: crypto.randomUUID(),
      type,
      number: nextDocNumber(docs, type),
      customer: "",
      customerEmail: "",
      customerAddress: "",
      date: today(),
      due: today(type === "Invoice" ? 14 : 14),
      items: [
        { id: crypto.randomUUID(), kind: "Labour", description: "", qty: 1, unitPrice: 0 },
      ],
      vat: true,
      vatRate: 20,
      notes: "",
      terms:
        type === "Invoice"
          ? "Payment due within 14 days. BACS to Steady Works Ltd."
          : "Quote valid for 14 days. 50% deposit on acceptance.",
      status: "Draft",
    };
    setEditing(draft);
  }

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoicing & Quotes</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Branded documents, ready to send. Stripe-grade workflow for your trades business.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => newDraft("Quote")}>
              <Plus className="h-4 w-4" /> New Quote
            </Button>
            <Button className="gap-2" onClick={() => newDraft("Invoice")}>
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Outstanding" value={gbp(kpis.outstanding)} icon={Clock} accent="warning" />
          <Kpi label="Collected" value={gbp(kpis.collected)} icon={CheckCircle2} accent="success" />
          <Kpi label="Drafts" value={String(kpis.drafts)} icon={FileText} />
          <Kpi label="Quotes live" value={String(kpis.quotes)} icon={Receipt} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <Receipt className="h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="estimator" className="gap-2">
              <Calculator className="h-4 w-4" /> Job Estimator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by number, customer, type…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["All", "Draft", "Sent", "Paid", "Unpaid", "Accepted", "Rejected", "Converted"] as const).map(
                  (s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={filter === s ? "default" : "outline"}
                      onClick={() => setFilter(s)}
                    >
                      {s}
                    </Button>
                  ),
                )}
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Number</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-right p-3">Total</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => {
                      const t = totals(d);
                      return (
                        <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs font-bold">{d.number}</td>
                          <td className="p-3">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold",
                                d.type === "Invoice"
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-foreground",
                              )}
                            >
                              {d.type}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{d.customer || <span className="text-muted-foreground">—</span>}</td>
                          <td className="p-3 text-muted-foreground tabular-nums">
                            {new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </td>
                          <td className="p-3 text-right font-bold tabular-nums">{gbp(t.total)}</td>
                          <td className="p-3">
                            <span className={statusBadge(d.status)}>{d.status}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setPreview(d)} aria-label="Preview">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditing(d)} aria-label="Edit">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => duplicate(d)} aria-label="Duplicate">
                                <Copy className="h-4 w-4" />
                              </Button>
                              {d.type === "Quote" && d.status !== "Converted" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => convertQuote(d)}
                                  aria-label="Convert to invoice"
                                  title="Convert to invoice"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              )}
                              {d.type === "Invoice" && d.status !== "Paid" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => {
                                    setStatus(d.id, "Paid");
                                    toast.success(`${d.number} marked as paid.`);
                                  }}
                                >
                                  Mark paid
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => remove(d.id)} aria-label="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No documents match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {customers.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        newDraft("Invoice");
                        setTimeout(() => {
                          setEditing((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  customer: c.name,
                                  customerEmail: c.email,
                                  customerAddress: c.address ?? "",
                                }
                              : prev,
                          );
                        }, 0);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border bg-card hover:bg-muted transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estimator" className="mt-4">
            <JobEstimator
              onCreateQuote={(items, customer) => {
                const draft: DocRecord = {
                  id: crypto.randomUUID(),
                  type: "Quote",
                  number: `QT-${Math.floor(Math.random() * 9000) + 1000}`,
                  customer,
                  customerEmail: "",
                  customerAddress: "",
                  date: today(),
                  due: today(14),
                  items,
                  vat: true,
                  vatRate: 20,
                  notes: "Generated from Job Estimator.",
                  terms: "Quote valid for 14 days. 50% deposit on acceptance.",
                  status: "Draft",
                };
                setEditing(draft);
                setTab("dashboard");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DocEditor
        doc={editing}
        onClose={() => setEditing(null)}
        onSave={(d) => {
          saveDoc(d);
          setEditing(null);
          toast.success(`${d.type} ${d.number} saved.`);
        }}
        onSend={(d) => {
          saveDoc({ ...d, status: d.type === "Invoice" ? "Sent" : "Sent" });
          setEditing(null);
          toast.success(`Sent to ${d.customerEmail || d.customer}`, {
            description: "Branded PDF attached automatically.",
          });
        }}
        onPreview={(d) => setPreview(d)}
      />

      <PreviewDialog
        doc={preview}
        onClose={() => setPreview(null)}
        onMarkPaid={(d) => {
          setStatus(d.id, "Paid");
          setPreview(null);
          toast.success(`${d.number} marked as paid.`);
        }}
        onSend={(d) => {
          setStatus(d.id, "Sent");
          setPreview(null);
          toast.success("Resent to customer.");
        }}
      />
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "success" | "warning";
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            accent === "success" && "bg-success/15 text-success-foreground",
            accent === "warning" && "bg-warning/15 text-warning-foreground",
            !accent && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-xl font-bold tabular-nums truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocEditor({
  doc,
  onClose,
  onSave,
  onSend,
  onPreview,
}: {
  doc: DocRecord | null;
  onClose: () => void;
  onSave: (d: DocRecord) => void;
  onSend: (d: DocRecord) => void;
  onPreview: (d: DocRecord) => void;
}) {
  const [draft, setDraft] = useState<DocRecord | null>(doc);

  if (doc && draft?.id !== doc.id) {
    setDraft(doc);
  }
  if (!doc && draft) {
    setDraft(null);
  }

  if (!draft) return null;
  const t = totals(draft);

  const update = (patch: Partial<DocRecord>) => setDraft({ ...draft, ...patch });
  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setDraft({ ...draft, items: draft.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const addItem = () =>
    setDraft({
      ...draft,
      items: [
        ...draft.items,
        { id: crypto.randomUUID(), kind: "Labour", description: "", qty: 1, unitPrice: 0 },
      ],
    });
  const removeItem = (id: string) =>
    setDraft({ ...draft, items: draft.items.filter((i) => i.id !== id) });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {draft.status === "Draft" ? `New ${draft.type}` : `Edit ${draft.type}`} · {draft.number}
          </DialogTitle>
          <DialogDescription>
            Auto-saves as you work. Send straight from here with a branded PDF attached.
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer name">
                <Input value={draft.customer} onChange={(e) => update({ customer: e.target.value })} />
              </Field>
              <Field label="Customer email">
                <Input
                  type="email"
                  value={draft.customerEmail}
                  onChange={(e) => update({ customerEmail: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Customer address">
              <Textarea
                rows={2}
                value={draft.customerAddress}
                onChange={(e) => update({ customerAddress: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <Input type="date" value={draft.date} onChange={(e) => update({ date: e.target.value })} />
              </Field>
              <Field label={draft.type === "Invoice" ? "Due date" : "Valid until"}>
                <Input type="date" value={draft.due} onChange={(e) => update({ due: e.target.value })} />
              </Field>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button size="sm" variant="outline" className="gap-1" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" /> Add line
                </Button>
              </div>
              <div className="space-y-2">
                {draft.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <Select value={item.kind} onValueChange={(v) => updateItem(item.id, { kind: v as LineItem["kind"] })}>
                      <SelectTrigger className="col-span-3 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Labour", "Materials", "Travel", "Callout", "Other"] as const).map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="col-span-5 h-9"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    />
                    <Input
                      className="col-span-1 h-9 text-right"
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                    />
                    <Input
                      className="col-span-2 h-9 text-right"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="col-span-1 h-9 w-9"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">VAT</div>
                <div className="text-xs text-muted-foreground">Toggle and set the rate.</div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  className="w-20 h-9 text-right"
                  type="number"
                  value={draft.vatRate}
                  onChange={(e) => update({ vatRate: Number(e.target.value) })}
                  disabled={!draft.vat}
                />
                <span className="text-xs text-muted-foreground">%</span>
                <Switch checked={draft.vat} onCheckedChange={(v) => update({ vat: v })} />
              </div>
            </div>

            <Field label="Notes">
              <Textarea rows={2} value={draft.notes} onChange={(e) => update({ notes: e.target.value })} />
            </Field>
            <Field label="Terms & payment">
              <Textarea rows={2} value={draft.terms} onChange={(e) => update({ terms: e.target.value })} />
            </Field>
          </div>

          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Live preview</div>
            <DocumentTemplate doc={draft} compact />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <div className="mr-auto text-sm">
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-extrabold text-lg tabular-nums">{gbp(t.total)}</span>
          </div>
          <Button variant="outline" onClick={() => onPreview(draft)} className="gap-2">
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" onClick={() => onSave({ ...draft, status: "Draft" })}>
            Save draft
          </Button>
          <Button
            onClick={() => {
              if (!draft.customer.trim()) {
                toast.error("Add a customer first.");
                return;
              }
              onSend(draft);
            }}
            className="gap-2"
          >
            <Send className="h-4 w-4" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PreviewDialog({
  doc,
  onClose,
  onMarkPaid,
  onSend,
}: {
  doc: DocRecord | null;
  onClose: () => void;
  onMarkPaid: (d: DocRecord) => void;
  onSend: (d: DocRecord) => void;
}) {
  if (!doc) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {doc.type} {doc.number}
          </DialogTitle>
          <DialogDescription>Branded preview — exactly how your customer sees it.</DialogDescription>
        </DialogHeader>

        <div id="print-area">
          <DocumentTemplate doc={doc} />
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              window.print();
              toast.success("Use 'Save as PDF' in the print dialog.");
            }}
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => onSend(doc)}>
            <Mail className="h-4 w-4" /> Resend
          </Button>
          {doc.type === "Invoice" && doc.status !== "Paid" && (
            <Button className="gap-2" onClick={() => onMarkPaid(doc)}>
              <CheckCircle2 className="h-4 w-4" /> Mark as paid
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentTemplate({ doc, compact }: { doc: DocRecord; compact?: boolean }) {
  const t = totals(doc);
  const isInvoice = doc.type === "Invoice";

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 border rounded-xl shadow-sm overflow-hidden font-sans",
        compact ? "text-[12px]" : "text-sm",
      )}
    >
      <div className="bg-neutral-950 text-white px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center font-bold text-neutral-950">SW</div>
          <div>
            <div className="font-extrabold tracking-tight text-base leading-tight">{BUSINESS.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">{BUSINESS.tagline}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">{doc.type}</div>
          <div className="font-mono font-bold text-base">{doc.number}</div>
          {isInvoice && (
            <span
              className={cn(
                "inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                doc.status === "Paid"
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-400 text-neutral-900",
              )}
            >
              {doc.status === "Paid" ? "Paid" : "Unpaid"}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-neutral-200 bg-neutral-50">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">From</div>
          <div className="font-semibold">{BUSINESS.name}</div>
          <div className="text-neutral-600 text-[11px] leading-relaxed">
            {BUSINESS.address}
            <br />
            {BUSINESS.email} · {BUSINESS.phone}
            <br />
            {BUSINESS.website}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">Billed to</div>
          <div className="font-semibold">{doc.customer || "—"}</div>
          <div className="text-neutral-600 text-[11px] leading-relaxed whitespace-pre-line">
            {doc.customerAddress}
            {doc.customerEmail && (
              <>
                <br />
                {doc.customerEmail}
              </>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">Date</div>
          <div className="font-semibold tabular-nums">
            {new Date(doc.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">
            {isInvoice ? "Due" : "Valid until"}
          </div>
          <div className="font-semibold tabular-nums">
            {new Date(doc.due).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
              <th className="text-left py-2 font-semibold">Item</th>
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-right py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Unit</th>
              <th className="text-right py-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((i) => (
              <tr key={i.id} className="border-b border-neutral-100">
                <td className="py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                    {i.kind}
                  </span>
                </td>
                <td className="py-2.5">{i.description || <span className="text-neutral-400">—</span>}</td>
                <td className="py-2.5 text-right tabular-nums">{i.qty}</td>
                <td className="py-2.5 text-right tabular-nums">{gbp(i.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums font-semibold">{gbp(i.qty * i.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-72 space-y-1.5">
            <Row label="Subtotal" value={gbp(t.sub)} />
            {doc.vat && <Row label={`VAT (${doc.vatRate}%)`} value={gbp(t.vat)} />}
            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-neutral-900">
              <span className="font-bold text-base">Total</span>
              <span className="font-extrabold text-xl tabular-nums">{gbp(t.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            {doc.notes && (
              <>
                <div className="text-[10px] uppercase tracking-widest text-neutral-500">Notes</div>
                <div className="text-[11px] text-neutral-700 mt-1 whitespace-pre-line">{doc.notes}</div>
              </>
            )}
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-3">Terms</div>
            <div className="text-[11px] text-neutral-700 mt-1 whitespace-pre-line">{doc.terms}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500">Signed</div>
            <div className="border-b border-neutral-300 h-12 mt-1" />
            <div className="text-[10px] text-neutral-500 mt-1">
              {isInvoice ? "Customer signature on receipt" : "Customer acceptance"}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-[10px] text-neutral-500 flex justify-between">
        <span>{BUSINESS.name} · {BUSINESS.website}</span>
        <span>Thank you for your business.</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-700">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

const JOB_PRESETS: Record<
  string,
  { dayRate: number; hourlyRate?: number; calloutFirstHour?: number; difficulty: number }
> = {
  Plumbing: { dayRate: 320, hourlyRate: 65, calloutFirstHour: 100, difficulty: 1.1 },
  "Emergency callout": { dayRate: 0, hourlyRate: 75, calloutFirstHour: 100, difficulty: 1.3 },
  Gardening: { dayRate: 260, hourlyRate: 35, difficulty: 0.9 },
  Handyman: { dayRate: 280, hourlyRate: 40, difficulty: 1.0 },
  "General maintenance": { dayRate: 300, hourlyRate: 45, difficulty: 1.0 },
  "Labour only": { dayRate: 300, hourlyRate: 40, difficulty: 1.0 },
  "Materials + labour": { dayRate: 300, hourlyRate: 50, difficulty: 1.05 },
};

function JobEstimator({
  onCreateQuote,
}: {
  onCreateQuote: (items: LineItem[], customer: string) => void;
}) {
  const [type, setType] = useState<keyof typeof JOB_PRESETS>("Plumbing");
  const [hours, setHours] = useState(3);
  const [materials, setMaterials] = useState(85);
  const [travel, setTravel] = useState(12);
  const [emergency, setEmergency] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [margin, setMargin] = useState(25);
  const [customer, setCustomer] = useState("");

  const preset = JOB_PRESETS[type];

  const labourBase = useMemo(() => {
    const hourly = preset.hourlyRate ?? Math.round(preset.dayRate / 8);
    if (emergency || type === "Emergency callout") {
      const callout = preset.calloutFirstHour ?? 100;
      const extra = Math.max(0, hours - 1) * hourly;
      return callout + extra;
    }
    return hours * hourly;
  }, [type, hours, emergency, preset]);

  const travelCost = travel * 0.65;
  const difficultyMult = difficulty * preset.difficulty;
  const cost = (labourBase + materials + travelCost) * difficultyMult;
  const suggested = cost * (1 + margin / 100);
  const profit = suggested - cost;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Job Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job type">
              <Select value={type} onValueChange={(v) => setType(v as keyof typeof JOB_PRESETS)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(JOB_PRESETS).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Customer (optional)">
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Mr Jones" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Hours">
              <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </Field>
            <Field label="Materials £">
              <Input type="number" value={materials} onChange={(e) => setMaterials(Number(e.target.value))} />
            </Field>
            <Field label="Travel (miles)">
              <Input type="number" value={travel} onChange={(e) => setTravel(Number(e.target.value))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Difficulty multiplier">
              <Input
                type="number"
                step="0.05"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              />
            </Field>
            <Field label="Profit margin %">
              <Input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Emergency callout</div>
              <div className="text-xs text-muted-foreground">£100 first hour, then hourly rate.</div>
            </div>
            <Switch checked={emergency} onCheckedChange={setEmergency} />
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => {
              const items: LineItem[] = [
                {
                  id: crypto.randomUUID(),
                  kind: emergency ? "Callout" : "Labour",
                  description: `${type} — ${hours}h${emergency ? " (emergency)" : ""}`,
                  qty: 1,
                  unitPrice: Math.round(labourBase * difficultyMult),
                },
                {
                  id: crypto.randomUUID(),
                  kind: "Materials",
                  description: "Materials & parts",
                  qty: 1,
                  unitPrice: Math.round(materials * difficultyMult),
                },
                {
                  id: crypto.randomUUID(),
                  kind: "Travel",
                  description: `${travel} miles`,
                  qty: 1,
                  unitPrice: Math.round(travelCost),
                },
              ];
              onCreateQuote(items, customer);
              toast.success("Quote draft created from estimate.");
            }}
          >
            <FileText className="h-4 w-4" /> Generate quote from estimate
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimate breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Breakdown label="Labour" value={gbp(labourBase)} />
          <Breakdown label="Materials" value={gbp(materials)} />
          <Breakdown label="Travel" value={gbp(travelCost)} />
          <Breakdown label="Difficulty" value={`× ${difficultyMult.toFixed(2)}`} />
          <div className="border-t pt-3 space-y-2">
            <Breakdown label="Estimated cost" value={gbp(cost)} muted />
            <Breakdown label={`Margin (${margin}%)`} value={gbp(profit)} muted />
          </div>
          <div className="rounded-lg bg-secondary text-secondary-foreground p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-70">Suggested customer charge</div>
              <div className="text-3xl font-extrabold tabular-nums">{gbp(suggested)}</div>
            </div>
            <Receipt className="h-8 w-8 opacity-50" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Based on UK trades averages — adjust hours, materials & margin to match the job.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Breakdown({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between text-sm", muted && "text-muted-foreground")}>
      <span>{label}</span>
      <span className="tabular-nums font-semibold">{value}</span>
    </div>
  );
}
