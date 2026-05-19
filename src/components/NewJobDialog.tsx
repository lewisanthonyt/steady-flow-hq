import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Search, UserPlus, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJobsStore, createJob, createCustomer, type JobPriority } from "@/lib/jobs-store";

export function NewJobDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const store = useJobsStore();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");

  // new customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // job
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [description, setDescription] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("Tom");
  const [priority, setPriority] = useState<JobPriority>("Normal");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const list = store.customers;
    if (!q) return list.slice(0, 8);
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)).slice(0, 8);
  }, [store.customers, customerSearch]);

  const selectedCustomer = store.customers.find((c) => c.id === customerId);

  function reset() {
    setMode("existing");
    setCustomerId("");
    setCustomerSearch("");
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setJobType("");
    setDescription("");
    setPriority("Normal");
  }

  function submit() {
    let cid = customerId;
    let cname = selectedCustomer?.name ?? "";
    let caddr = selectedCustomer?.address ?? address;

    if (mode === "new") {
      if (!name.trim()) return toast.error("Add a customer name.");
      const c = createCustomer({ name: name.trim(), phone, email, address });
      cid = c.id;
      cname = c.name;
      caddr = address || c.address;
    } else {
      if (!cid || !selectedCustomer) return toast.error("Pick an existing customer.");
      cname = selectedCustomer.name;
      caddr = address || selectedCustomer.address;
    }

    if (!jobType.trim()) return toast.error("Add a job type.");

    const job = createJob({
      customerId: cid,
      customerName: cname,
      address: caddr,
      jobType: jobType.trim(),
      description,
      assignedStaff,
      priority,
      dueDate,
    });
    toast.success(`${job.id} created`, { description: `${jobType} · ${cname}` });
    onOpenChange(false);
    reset();
    navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Create new job
          </DialogTitle>
          <DialogDescription>
            Every job gets a unique Job ID — everything attached stays in one workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="existing"><Search className="h-3.5 w-3.5 mr-1.5" /> Existing customer</TabsTrigger>
            <TabsTrigger value="new"><UserPlus className="h-3.5 w-3.5 mr-1.5" /> New customer</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 mt-3">
            <Input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customers by name or address…"
            />
            <div className="max-h-44 overflow-y-auto border rounded-md divide-y">
              {filteredCustomers.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground text-center">No matches.</div>
              )}
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCustomerId(c.id); setAddress(c.address); }}
                  className={`w-full text-left p-2.5 hover:bg-muted/40 ${customerId === c.id ? "bg-primary/10" : ""}`}
                >
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.address}</div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="space-y-1.5 col-span-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t pt-3 mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 col-span-2"><Label>Job type</Label><Input value={jobType} onChange={(e) => setJobType(e.target.value)} placeholder="Boiler service, Bathroom refit…" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Job site address" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Assigned</Label>
              <Select value={assignedStaff} onValueChange={setAssignedStaff}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Tom", "Jay", "Tom + Jay", "Unassigned"].map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as JobPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Low", "Normal", "High", "Urgent"] as JobPriority[]).map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
