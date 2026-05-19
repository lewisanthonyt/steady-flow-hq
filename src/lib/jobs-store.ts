import { useSyncExternalStore } from "react";
import {
  jobs as seedJobs,
  customers as seedCustomers,
  quotes as seedQuotes,
  type Customer,
  type JobStatus,
} from "@/lib/mock-data";

// ============= Types =============
export type JobPriority = "Low" | "Normal" | "High" | "Urgent";

export interface JobQuote {
  id: string;
  number: string; // SW-Q-1042
  revision: number;
  work: string;
  price: number;
  terms: string;
  status: "Draft" | "Sent" | "Accepted" | "Declined" | "Expired";
  expiry: string;
  createdAt: string;
}

export interface JobPayment {
  id: string;
  date: string;
  amount: number;
  method: "Card" | "Bank Transfer" | "Cash" | "Cheque" | "Other";
  note?: string;
}

export interface JobInvoice {
  id: string;
  number: string; // SW-INV-1042
  kind: "Deposit" | "Interim" | "Final";
  amount: number;
  notes?: string;
  status: "Draft" | "Sent" | "Part Paid" | "Paid" | "Overdue";
  createdAt: string;
  dueDate: string;
  payments: JobPayment[];
}

export interface JobFile {
  id: string;
  name: string;
  kind: "image" | "pdf" | "video" | "other";
  /** data: URL (small) or external URL */
  url: string;
  size: number;
  uploadedAt: string;
  caption?: string;
}

export interface JobNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface JobTaskItem {
  id: string;
  title: string;
  assignee: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

export interface JobAppointment {
  id: string;
  title: string;
  date: string;
  time?: string;
  note?: string;
}

export type ActivityKind =
  | "job.created"
  | "job.status"
  | "quote.added"
  | "quote.sent"
  | "quote.accepted"
  | "quote.declined"
  | "quote.converted"
  | "invoice.added"
  | "invoice.sent"
  | "invoice.paid"
  | "payment.recorded"
  | "file.uploaded"
  | "note.added"
  | "task.added"
  | "task.completed"
  | "appointment.added";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  at: string;
  message: string;
  by?: string;
}

export interface Job {
  id: string; // JOB-1001
  customerId: string;
  customerName: string;
  address: string;
  jobType: string;
  description?: string;
  assignedStaff: string;
  priority: JobPriority;
  status: JobStatus;
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  quotes: JobQuote[];
  invoices: JobInvoice[];
  files: JobFile[];
  notes: JobNote[];
  tasks: JobTaskItem[];
  appointments: JobAppointment[];
  activity: ActivityEvent[];
}

interface StoreState {
  counter: number; // next job number = 1000 + counter
  quoteCounter: number;
  invoiceCounter: number;
  jobs: Job[];
  customers: Customer[];
}

// ============= Persistence =============
const KEY = "sw_jobs_store_v2";

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function seed(): StoreState {
  const now = new Date();
  const isoOffset = (d: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    return x.toISOString();
  };

  let counter = 0;
  let qCounter = 0;
  let iCounter = 0;
  const jobs: Job[] = seedJobs.map((j) => {
    counter += 1;
    const id = `JOB-${1000 + counter}`;
    const created = isoOffset(-Math.abs(new Date(j.date).getDate() % 30));
    const activity: ActivityEvent[] = [
      { id: uid("a"), kind: "job.created", at: created, message: `Job created · ${j.jobType}` },
    ];
    const quotes: JobQuote[] = [];
    if (j.priceQuoted > 0) {
      qCounter += 1;
      quotes.push({
        id: uid("q"),
        number: `SW-Q-${1040 + qCounter}`,
        revision: 1,
        work: j.description,
        price: j.priceQuoted,
        terms: "Payment on completion. Parts included.",
        status: j.status === "Quote Sent" ? "Sent" : "Accepted",
        expiry: isoOffset(14).slice(0, 10),
        createdAt: created,
      });
      activity.push({
        id: uid("a"),
        kind: "quote.added",
        at: created,
        message: `Quote ${quotes[0].number} created · £${j.priceQuoted}`,
      });
    }
    const invoices: JobInvoice[] = [];
    if (j.finalInvoice > 0) {
      iCounter += 1;
      const paid = j.status === "Paid";
      const inv: JobInvoice = {
        id: uid("i"),
        number: `SW-INV-${1040 + iCounter}`,
        kind: "Final",
        amount: j.finalInvoice,
        status: paid ? "Paid" : "Sent",
        createdAt: created,
        dueDate: isoOffset(14).slice(0, 10),
        payments: paid
          ? [{ id: uid("p"), date: isoOffset(-1).slice(0, 10), amount: j.finalInvoice, method: "Bank Transfer" }]
          : [],
      };
      invoices.push(inv);
      activity.push({
        id: uid("a"),
        kind: "invoice.added",
        at: created,
        message: `Invoice ${inv.number} created · £${j.finalInvoice}`,
      });
      if (paid) {
        activity.push({
          id: uid("a"),
          kind: "invoice.paid",
          at: isoOffset(-1),
          message: `Invoice ${inv.number} paid in full`,
        });
      }
    }

    return {
      id,
      customerId: j.customerId,
      customerName: j.customer,
      address: j.address,
      jobType: j.jobType,
      description: j.description,
      assignedStaff: j.assignedStaff,
      priority: "Normal",
      status: j.status,
      createdAt: created,
      dueDate: j.date,
      completedAt: j.status === "Paid" || j.status === "Completed" ? j.date : undefined,
      quotes,
      invoices,
      files: [],
      notes: j.notes
        ? [{ id: uid("n"), body: j.notes, author: "Boss", createdAt: created }]
        : [],
      tasks: [],
      appointments: j.date
        ? [{ id: uid("ap"), title: `On-site · ${j.jobType}`, date: j.date, time: j.time }]
        : [],
      activity,
    };
  });

  // Sanity: seed at least mentions seedQuotes count
  void seedQuotes;

  return {
    counter,
    quoteCounter: qCounter,
    invoiceCounter: iCounter,
    jobs,
    customers: [...seedCustomers],
  };
}

function load(): StoreState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as StoreState;
  } catch {
    return seed();
  }
}

function save(s: StoreState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

// ============= Reactive store =============
let state: StoreState | null = null;
const listeners = new Set<() => void>();

function getState(): StoreState {
  if (state === null) state = load();
  return state;
}

function setState(next: StoreState) {
  state = next;
  save(next);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getServerSnapshot(): StoreState {
  // SSR: return empty deterministic snapshot
  return { counter: 0, quoteCounter: 0, invoiceCounter: 0, jobs: [], customers: [] };
}

export function useJobsStore() {
  const s = useSyncExternalStore(subscribe, getState, getServerSnapshot);
  return s;
}

// ============= Mutations =============
function mutate(fn: (s: StoreState) => StoreState) {
  const cur = getState();
  setState(fn(cur));
}

function pushActivity(job: Job, ev: Omit<ActivityEvent, "id" | "at"> & { at?: string }) {
  job.activity = [
    { id: uid("a"), at: ev.at ?? new Date().toISOString(), kind: ev.kind, message: ev.message, by: ev.by },
    ...job.activity,
  ];
}

export function createCustomer(input: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Customer {
  const c: Customer = {
    id: uid("c"),
    name: input.name,
    phone: input.phone ?? "",
    email: input.email ?? "",
    address: input.address ?? "",
    totalRevenue: 0,
    jobsCount: 0,
    lastContacted: new Date().toISOString().slice(0, 10),
  };
  mutate((s) => ({ ...s, customers: [c, ...s.customers] }));
  return c;
}

export function createJob(input: {
  customerId: string;
  customerName: string;
  address: string;
  jobType: string;
  description?: string;
  assignedStaff?: string;
  priority?: JobPriority;
  dueDate?: string;
}): Job {
  const cur = getState();
  const nextCounter = cur.counter + 1;
  const id = `JOB-${1000 + nextCounter}`;
  const now = new Date().toISOString();
  const job: Job = {
    id,
    customerId: input.customerId,
    customerName: input.customerName,
    address: input.address,
    jobType: input.jobType,
    description: input.description,
    assignedStaff: input.assignedStaff ?? "Unassigned",
    priority: input.priority ?? "Normal",
    status: "New Lead",
    createdAt: now,
    dueDate: input.dueDate,
    quotes: [],
    invoices: [],
    files: [],
    notes: [],
    tasks: [],
    appointments: [],
    activity: [
      {
        id: uid("a"),
        at: now,
        kind: "job.created",
        message: `Job ${id} created · ${input.jobType}`,
      },
    ],
  };
  mutate((s) => ({ ...s, counter: nextCounter, jobs: [job, ...s.jobs] }));
  return job;
}

function withJob(jobId: string, fn: (j: Job, s: StoreState) => void) {
  mutate((s) => {
    const jobs = s.jobs.map((j) => {
      if (j.id !== jobId) return j;
      const draft: Job = { ...j, quotes: [...j.quotes], invoices: [...j.invoices], files: [...j.files], notes: [...j.notes], tasks: [...j.tasks], appointments: [...j.appointments], activity: [...j.activity] };
      fn(draft, s);
      return draft;
    });
    return { ...s, jobs };
  });
}

export function setJobStatus(jobId: string, status: JobStatus) {
  withJob(jobId, (j) => {
    const prev = j.status;
    j.status = status;
    if (status === "Completed" || status === "Paid") j.completedAt = new Date().toISOString();
    pushActivity(j, { kind: "job.status", message: `Status: ${prev} → ${status}` });
  });
}

export function addQuote(
  jobId: string,
  input: { work: string; price: number; terms?: string; expiry?: string },
): JobQuote | null {
  let created: JobQuote | null = null;
  mutate((s) => {
    const nextQ = s.quoteCounter + 1;
    const number = `SW-Q-${1040 + nextQ}`;
    const jobs = s.jobs.map((j) => {
      if (j.id !== jobId) return j;
      const revision = j.quotes.length + 1;
      const q: JobQuote = {
        id: uid("q"),
        number,
        revision,
        work: input.work,
        price: input.price,
        terms: input.terms ?? "Payment on completion.",
        status: "Draft",
        expiry: input.expiry ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };
      created = q;
      const draft: Job = { ...j, quotes: [q, ...j.quotes], activity: [...j.activity] };
      pushActivity(draft, { kind: "quote.added", message: `Quote ${number} added (rev ${revision}) · £${input.price}` });
      return draft;
    });
    return { ...s, quoteCounter: nextQ, jobs };
  });
  return created;
}

export function updateQuoteStatus(jobId: string, quoteId: string, status: JobQuote["status"]) {
  withJob(jobId, (j) => {
    const q = j.quotes.find((x) => x.id === quoteId);
    if (!q) return;
    q.status = status;
    const kind: ActivityKind = status === "Accepted" ? "quote.accepted" : status === "Declined" ? "quote.declined" : status === "Sent" ? "quote.sent" : "quote.added";
    pushActivity(j, { kind, message: `Quote ${q.number} → ${status}` });
  });
}

export function convertQuoteToInvoice(
  jobId: string,
  quoteId: string,
  kind: JobInvoice["kind"] = "Final",
): JobInvoice | null {
  let created: JobInvoice | null = null;
  mutate((s) => {
    const nextI = s.invoiceCounter + 1;
    const number = `SW-INV-${1040 + nextI}`;
    const jobs = s.jobs.map((j) => {
      if (j.id !== jobId) return j;
      const q = j.quotes.find((x) => x.id === quoteId);
      if (!q) return j;
      const inv: JobInvoice = {
        id: uid("i"),
        number,
        kind,
        amount: q.price,
        status: "Draft",
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        payments: [],
      };
      created = inv;
      const draft: Job = {
        ...j,
        invoices: [inv, ...j.invoices],
        quotes: j.quotes.map((x) => (x.id === quoteId ? { ...x, status: "Accepted" as const } : x)),
        activity: [...j.activity],
        status: j.status === "New Lead" || j.status === "Quote Sent" ? "Invoiced" : j.status,
      };
      pushActivity(draft, { kind: "quote.converted", message: `Quote ${q.number} → Invoice ${number}` });
      return draft;
    });
    return { ...s, invoiceCounter: nextI, jobs };
  });
  return created;
}

export function addInvoice(
  jobId: string,
  input: { kind: JobInvoice["kind"]; amount: number; dueDate?: string; notes?: string },
): JobInvoice | null {
  let created: JobInvoice | null = null;
  mutate((s) => {
    const nextI = s.invoiceCounter + 1;
    const number = `SW-INV-${1040 + nextI}`;
    const jobs = s.jobs.map((j) => {
      if (j.id !== jobId) return j;
      const inv: JobInvoice = {
        id: uid("i"),
        number,
        kind: input.kind,
        amount: input.amount,
        notes: input.notes,
        status: "Draft",
        createdAt: new Date().toISOString(),
        dueDate: input.dueDate ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        payments: [],
      };
      created = inv;
      const draft: Job = { ...j, invoices: [inv, ...j.invoices], activity: [...j.activity] };
      pushActivity(draft, { kind: "invoice.added", message: `${input.kind} invoice ${number} · £${input.amount}` });
      return draft;
    });
    return { ...s, invoiceCounter: nextI, jobs };
  });
  return created;
}

export function recordPayment(jobId: string, invoiceId: string, p: Omit<JobPayment, "id">) {
  withJob(jobId, (j) => {
    const inv = j.invoices.find((x) => x.id === invoiceId);
    if (!inv) return;
    const payment: JobPayment = { id: uid("p"), ...p };
    inv.payments = [payment, ...inv.payments];
    const paidTotal = inv.payments.reduce((s, x) => s + x.amount, 0);
    inv.status = paidTotal >= inv.amount ? "Paid" : paidTotal > 0 ? "Part Paid" : inv.status;
    pushActivity(j, { kind: "payment.recorded", message: `Payment £${p.amount} on ${inv.number} (${p.method})` });
    if (inv.status === "Paid") {
      pushActivity(j, { kind: "invoice.paid", message: `Invoice ${inv.number} fully paid` });
      // If all invoices paid, mark job paid
      const allPaid = j.invoices.every((x) => x.status === "Paid");
      if (allPaid) {
        j.status = "Paid";
        j.completedAt = j.completedAt ?? new Date().toISOString();
      }
    }
  });
}

export function addFile(jobId: string, file: Omit<JobFile, "id" | "uploadedAt">) {
  withJob(jobId, (j) => {
    const f: JobFile = { id: uid("f"), uploadedAt: new Date().toISOString(), ...file };
    j.files = [f, ...j.files];
    pushActivity(j, { kind: "file.uploaded", message: `Uploaded ${f.name}` });
  });
}

export function removeFile(jobId: string, fileId: string) {
  withJob(jobId, (j) => {
    j.files = j.files.filter((f) => f.id !== fileId);
  });
}

export function addNote(jobId: string, body: string, author = "Boss") {
  withJob(jobId, (j) => {
    const n: JobNote = { id: uid("n"), body, author, createdAt: new Date().toISOString() };
    j.notes = [n, ...j.notes];
    pushActivity(j, { kind: "note.added", message: `Note: "${body.slice(0, 60)}${body.length > 60 ? "…" : ""}"` });
  });
}

export function addTask(jobId: string, input: Omit<JobTaskItem, "id" | "done" | "createdAt">) {
  withJob(jobId, (j) => {
    const t: JobTaskItem = { id: uid("t"), done: false, createdAt: new Date().toISOString(), ...input };
    j.tasks = [t, ...j.tasks];
    pushActivity(j, { kind: "task.added", message: `Task: ${t.title}` });
  });
}

export function toggleTask(jobId: string, taskId: string) {
  withJob(jobId, (j) => {
    const t = j.tasks.find((x) => x.id === taskId);
    if (!t) return;
    t.done = !t.done;
    if (t.done) pushActivity(j, { kind: "task.completed", message: `Completed: ${t.title}` });
  });
}

export function addAppointment(jobId: string, input: Omit<JobAppointment, "id">) {
  withJob(jobId, (j) => {
    const a: JobAppointment = { id: uid("ap"), ...input };
    j.appointments = [a, ...j.appointments];
    pushActivity(j, { kind: "appointment.added", message: `Visit booked ${a.date}${a.time ? " " + a.time : ""}` });
  });
}

// ============= Selectors =============
export function jobTotals(j: Job) {
  const quoted = j.quotes.reduce((s, q) => s + (q.status === "Accepted" ? q.price : 0), 0)
    || j.quotes[0]?.price || 0;
  const invoiced = j.invoices.reduce((s, i) => s + i.amount, 0);
  const paid = j.invoices.reduce((s, i) => s + i.payments.reduce((p, x) => p + x.amount, 0), 0);
  const outstanding = invoiced - paid;
  return { quoted, invoiced, paid, outstanding };
}

export function customerStats(s: StoreState, customerId: string) {
  const jobs = s.jobs.filter((j) => j.customerId === customerId);
  let lifetime = 0;
  let outstanding = 0;
  jobs.forEach((j) => {
    const t = jobTotals(j);
    lifetime += t.paid;
    outstanding += t.outstanding;
  });
  return { jobs, lifetime, outstanding };
}

export function globalSearch(s: StoreState, q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return { jobs: [], customers: [] };
  const jobs = s.jobs.filter((j) =>
    j.id.toLowerCase().includes(term)
    || j.customerName.toLowerCase().includes(term)
    || j.address.toLowerCase().includes(term)
    || j.jobType.toLowerCase().includes(term)
    || j.quotes.some((qq) => qq.number.toLowerCase().includes(term))
    || j.invoices.some((ii) => ii.number.toLowerCase().includes(term)),
  ).slice(0, 8);
  const customers = s.customers.filter((c) =>
    c.name.toLowerCase().includes(term) || c.address.toLowerCase().includes(term),
  ).slice(0, 5);
  return { jobs, customers };
}

export function resetStore() {
  setState(seed());
}
