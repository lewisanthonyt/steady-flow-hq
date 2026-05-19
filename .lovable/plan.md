## Restructure platform around Job-centric workspace

Shift the app's data model so **Jobs** are the central container. Quotes, invoices, photos, notes, tasks, files, and activity all live inside a Job. Customers can own many Jobs.

### 1. Data model (src/lib/mock-data.ts + new src/lib/jobs-store.ts)

New `Job` shape:
```
{
  id: "JOB-1007",
  customerId, customerName, address,
  jobType, status, priority, assignedStaff,
  createdAt, dueDate, completedAt,
  quotes: Quote[],      // multiple, with revisions + accepted flag
  invoices: Invoice[],  // deposits + finals, with payments[]
  files: FileItem[],    // photos, PDFs, receipts
  notes: Note[],
  tasks: Task[],
  appointments: Appointment[],
  activity: ActivityEvent[]   // auto-generated timeline
}
```

- `localStorage`-backed store (`sw_jobs_v1`) with a Zustand-like custom hook (`useJobsStore`) exposing CRUD + helpers (`createJob`, `addQuote`, `convertQuoteToInvoice`, `recordPayment`, `addFile`, `addNote`, `addTask`, `logActivity`).
- **Job number generator**: monotonic `JOB-{1000+n}` per workspace, never reused. Persisted counter `sw_job_counter_v1`.
- Activity events auto-appended on every mutation (quote sent, invoice paid, photo uploaded, status changed…).

### 2. Routes

| Route | Purpose |
|---|---|
| `/jobs` (rewrite) | Job list/kanban/calendar — now reads from store; **New Job** dialog with **Existing / New customer** choice |
| `/jobs/$jobId` (new) | Full job workspace |
| `/customers/$customerId` (new) | Customer profile: all jobs, totals, history timeline |
| `/quotes`, `/invoicing` (refactor) | Become **cross-job lists** — every row links back to its parent Job |

### 3. Job workspace `/jobs/$jobId`

Tabbed layout (`Overview · Quotes · Invoices · Files · Notes · Tasks · Activity`):
- **Overview**: status badge, customer card (links to profile), address, assigned staff, priority, dates, totals (quoted, invoiced, paid, outstanding).
- **Quotes**: list with revision history, accept/decline, **Convert to Invoice** button.
- **Invoices**: deposits + finals, payment history, outstanding balance, mark-paid.
- **Files**: gallery + timeline view, drag-drop upload (base64 in localStorage for demo, capped).
- **Notes**: rich-text-ish textarea entries with timestamps.
- **Tasks**: due date, assignee, checkbox completion.
- **Activity**: chronological feed of every change.

### 4. New Job flow

Single dialog reused from `/jobs`, `/quotes`, `/invoicing`, Quick Add:
1. Pick **Existing customer** (searchable) OR **New customer** (inline form).
2. Job type, address, priority, due date.
3. Submit → generates `JOB-####`, navigates to `/jobs/$jobId`.

### 5. Customer profile `/customers/$customerId`

- Header: name, contact, lifetime spend.
- Jobs grid (status chips, totals).
- Combined invoice/quote tables.
- Timeline of all activity across jobs.

### 6. Dashboard widgets (`/dashboard`)

Add: Recent Jobs, Active Jobs count, Outstanding Invoices total, Jobs Due Today, Recent Activity feed (pulls from store).

### 7. Global search

Header search box → searches Job IDs, customer names, addresses, quote/invoice numbers across the store. Results dropdown links to job workspace.

### Scope notes

- Pure frontend / localStorage — no Lovable Cloud yet (can be migrated later by swapping the store).
- Existing `/quotes` and `/invoicing` pages remain as cross-job indices; their builders now require a Job context (create/select Job first).
- Existing mock data seeded into new store on first load so the app isn't empty.
- Sidebar hydration mismatch in `Recent` section fixed as part of the AppShell touch (button vs div SSR mismatch).

### Out of scope (future)

Real file storage, email sending, Stripe, staff auth, calendar sync — store shape is ready for them.
