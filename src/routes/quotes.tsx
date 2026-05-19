import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, FileText, Mail, Plus, Send, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { quotes, emailTemplates, gbp } from "@/lib/mock-data";
import { useOpenJob } from "@/lib/job-links";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [
      { title: "Quotes & Templates — Steady Works HQ" },
      { name: "description", content: "Build quotes and send polished emails fast." },
    ],
  }),
  component: QuotesPage,
});

function quoteStatusColor(s: string) {
  switch (s) {
    case "Sent": return "bg-warning/15 text-warning-foreground border border-warning/30";
    case "Accepted": return "bg-success text-success-foreground";
    case "Declined":
    case "Expired": return "bg-muted text-muted-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
}

function QuotesPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quotes & Templates</h1>
            <p className="text-muted-foreground mt-1">Send professional quotes and follow-ups in seconds.</p>
          </div>
        </div>

        <Tabs defaultValue="quotes">
          <TabsList>
            <TabsTrigger value="quotes" className="gap-2"><FileText className="h-4 w-4" /> Quotes</TabsTrigger>
            <TabsTrigger value="builder" className="gap-2"><Plus className="h-4 w-4" /> New Quote</TabsTrigger>
            <TabsTrigger value="templates" className="gap-2"><Mail className="h-4 w-4" /> Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="mt-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Number</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Work</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-left p-3">Expires</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr key={q.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs font-bold">{q.number}</td>
                        <td className="p-3 font-medium">{q.customer}</td>
                        <td className="p-3 text-muted-foreground max-w-md truncate">{q.work}</td>
                        <td className="p-3 text-right font-bold tabular-nums">{gbp(q.price)}</td>
                        <td className="p-3 text-muted-foreground tabular-nums">
                          {new Date(q.expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${quoteStatusColor(q.status)}`}>{q.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="mt-4">
            <QuoteBuilder />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <TemplateLibrary />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function QuoteBuilder() {
  const [form, setForm] = useState({
    customer: "",
    work: "",
    price: 500,
    terms: "Payment on completion. Parts included.",
    expiry: 14,
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + form.expiry);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name</Label>
            <Input id="customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="e.g. Margaret Thompson" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="work">Work Required</Label>
            <Textarea id="work" rows={4} value={form.work} onChange={(e) => setForm({ ...form, work: e.target.value })} placeholder="Describe the work…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (£)</Label>
              <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expires in (days)</Label>
              <Input id="expiry" type="number" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms</Label>
            <Textarea id="terms" rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button
              className="gap-2 flex-1"
              onClick={() => {
                if (!form.customer.trim() || !form.work.trim()) {
                  toast.error("Add a customer and work description first.");
                  return;
                }
                toast.success(`Quote sent to ${form.customer}`, { description: `${gbp(form.price)} · expires in ${form.expiry} days` });
                setForm({ customer: "", work: "", price: 500, terms: form.terms, expiry: form.expiry });
              }}
            >
              <Send className="h-4 w-4" /> Send Quote
            </Button>
            <Button variant="outline" onClick={() => toast.success("Draft saved.")}>Save Draft</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-background space-y-4">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="font-extrabold text-lg tracking-tight">STEADY WORKS</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Plumbing & Maintenance</div>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono font-bold">SW-1044</div>
                <div className="text-muted-foreground">{new Date().toLocaleDateString("en-GB")}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Quote for</div>
              <div className="font-semibold">{form.customer || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Work</div>
              <div className="text-sm whitespace-pre-line">{form.work || "—"}</div>
            </div>
            <div className="flex items-end justify-between pt-3 border-t">
              <div>
                <div className="text-xs text-muted-foreground uppercase">Total</div>
                <div className="text-3xl font-extrabold text-primary tabular-nums">{gbp(form.price)}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Valid until</div>
                <div className="font-semibold text-foreground">{expiryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-3">{form.terms}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateLibrary() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {emailTemplates.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{t.subject}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${t.subject}\n\n${t.body}`);
                    toast.success("Template copied to clipboard");
                  } catch {
                    toast.error("Couldn't copy. Try again.");
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted/50 p-4 text-sm whitespace-pre-line font-mono text-foreground/90">
              {t.body}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
