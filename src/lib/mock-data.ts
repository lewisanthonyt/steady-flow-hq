export type JobStatus =
  | "New Lead"
  | "Quote Sent"
  | "Awaiting Approval"
  | "Booked"
  | "In Progress"
  | "Completed"
  | "Invoiced"
  | "Paid";

export interface Job {
  id: string;
  customerId: string;
  customer: string;
  address: string;
  jobType: string;
  description: string;
  assignedStaff: string;
  date: string; // ISO
  time: string;
  priceQuoted: number;
  depositPaid: number;
  materialsCost: number;
  finalInvoice: number;
  status: JobStatus;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalRevenue: number;
  jobsCount: number;
  lastContacted: string;
  notes?: string;
}

export interface Quote {
  id: string;
  number: string;
  customer: string;
  work: string;
  price: number;
  terms: string;
  expiry: string;
  status: "Draft" | "Sent" | "Accepted" | "Declined" | "Expired";
}

export interface Expense {
  id: string;
  date: string;
  category: "Materials" | "Fuel" | "Labour" | "Tools" | "Marketing" | "Misc";
  description: string;
  amount: number;
}

export const customers: Customer[] = [
  { id: "c1", name: "Margaret Thompson", phone: "07700 900123", email: "m.thompson@example.co.uk", address: "12 Oakfield Road, Manchester M14 5AB", totalRevenue: 4280, jobsCount: 6, lastContacted: "2026-04-21", notes: "Repeat customer. Prefers morning calls." },
  { id: "c2", name: "James O'Connor", phone: "07700 900456", email: "j.oconnor@example.co.uk", address: "47 Hilltop Crescent, Salford M6 7TR", totalRevenue: 1850, jobsCount: 2, lastContacted: "2026-04-19" },
  { id: "c3", name: "Priya Shah", phone: "07700 900789", email: "priya.shah@example.co.uk", address: "9 Birchwood Lane, Stockport SK4 2HQ", totalRevenue: 920, jobsCount: 1, lastContacted: "2026-04-15" },
  { id: "c4", name: "Daniel Wright", phone: "07700 900222", email: "d.wright@example.co.uk", address: "33 Riverside Park, Bolton BL1 4DP", totalRevenue: 6740, jobsCount: 9, lastContacted: "2026-04-22", notes: "Landlord — 3 properties." },
  { id: "c5", name: "Aisha Khan", phone: "07700 900555", email: "a.khan@example.co.uk", address: "108 Mill Street, Bury BL9 6AS", totalRevenue: 540, jobsCount: 1, lastContacted: "2026-04-10" },
  { id: "c6", name: "Robert McAllister", phone: "07700 900888", email: "r.mcallister@example.co.uk", address: "21 The Avenue, Wigan WN1 2BX", totalRevenue: 2310, jobsCount: 3, lastContacted: "2026-04-23" },
  { id: "c7", name: "Sophie Edwards", phone: "07700 900111", email: "s.edwards@example.co.uk", address: "76 Garden Close, Rochdale OL11 5JH", totalRevenue: 380, jobsCount: 1, lastContacted: "2026-04-08" },
  { id: "c8", name: "Marcus Bennett", phone: "07700 900333", email: "m.bennett@example.co.uk", address: "5 Kingfisher Walk, Oldham OL1 3PL", totalRevenue: 1190, jobsCount: 2, lastContacted: "2026-04-20" },
];

const today = new Date();
const iso = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const jobs: Job[] = [
  { id: "j1", customerId: "c1", customer: "Margaret Thompson", address: "12 Oakfield Road, Manchester", jobType: "Boiler Service", description: "Annual service + safety check", assignedStaff: "Tom", date: iso(0), time: "09:00", priceQuoted: 120, depositPaid: 0, materialsCost: 25, finalInvoice: 120, status: "In Progress" },
  { id: "j2", customerId: "c4", customer: "Daniel Wright", address: "33 Riverside Park, Bolton", jobType: "Bathroom Refit", description: "Full bathroom refit — supply & install", assignedStaff: "Tom + Jay", date: iso(1), time: "08:00", priceQuoted: 4800, depositPaid: 1500, materialsCost: 1900, finalInvoice: 4800, status: "Booked" },
  { id: "j3", customerId: "c2", customer: "James O'Connor", address: "47 Hilltop Crescent, Salford", jobType: "Leak Repair", description: "Kitchen sink leak under unit", assignedStaff: "Jay", date: iso(2), time: "10:30", priceQuoted: 180, depositPaid: 0, materialsCost: 30, finalInvoice: 0, status: "Quote Sent" },
  { id: "j4", customerId: "c6", customer: "Robert McAllister", address: "21 The Avenue, Wigan", jobType: "Radiator Install", description: "Replace 2 radiators in lounge", assignedStaff: "Tom", date: iso(3), time: "09:00", priceQuoted: 620, depositPaid: 200, materialsCost: 240, finalInvoice: 0, status: "Booked" },
  { id: "j5", customerId: "c3", customer: "Priya Shah", address: "9 Birchwood Lane, Stockport", jobType: "Tap Replacement", description: "Mixer tap upstairs", assignedStaff: "Jay", date: iso(-1), time: "14:00", priceQuoted: 95, depositPaid: 0, materialsCost: 35, finalInvoice: 95, status: "Paid" },
  { id: "j6", customerId: "c5", customer: "Aisha Khan", address: "108 Mill Street, Bury", jobType: "Drain Unblock", description: "Outside drain blockage", assignedStaff: "Tom", date: iso(-2), time: "11:00", priceQuoted: 140, depositPaid: 0, materialsCost: 0, finalInvoice: 140, status: "Invoiced" },
  { id: "j7", customerId: "c8", customer: "Marcus Bennett", address: "5 Kingfisher Walk, Oldham", jobType: "Emergency Callout", description: "Burst pipe in loft", assignedStaff: "Jay", date: iso(-3), time: "22:00", priceQuoted: 320, depositPaid: 0, materialsCost: 60, finalInvoice: 320, status: "Paid" },
  { id: "j8", customerId: "c7", customer: "Sophie Edwards", address: "76 Garden Close, Rochdale", jobType: "Quote Visit", description: "Quote for new combi boiler", assignedStaff: "Tom", date: iso(4), time: "13:00", priceQuoted: 0, depositPaid: 0, materialsCost: 0, finalInvoice: 0, status: "New Lead" },
  { id: "j9", customerId: "c4", customer: "Daniel Wright", address: "33 Riverside Park, Bolton", jobType: "Toilet Install", description: "New toilet — rental property", assignedStaff: "Jay", date: iso(-5), time: "10:00", priceQuoted: 290, depositPaid: 0, materialsCost: 110, finalInvoice: 290, status: "Paid" },
  { id: "j10", customerId: "c1", customer: "Margaret Thompson", address: "12 Oakfield Road, Manchester", jobType: "Outside Tap", description: "Install garden tap", assignedStaff: "Tom", date: iso(-7), time: "09:30", priceQuoted: 160, depositPaid: 0, materialsCost: 45, finalInvoice: 160, status: "Paid" },
  { id: "j11", customerId: "c6", customer: "Robert McAllister", address: "21 The Avenue, Wigan", jobType: "Power Flush", description: "Full system power flush", assignedStaff: "Tom + Jay", date: iso(5), time: "08:30", priceQuoted: 540, depositPaid: 0, materialsCost: 80, finalInvoice: 0, status: "Awaiting Approval" },
  { id: "j12", customerId: "c2", customer: "James O'Connor", address: "47 Hilltop Crescent, Salford", jobType: "Shower Install", description: "Replace electric shower", assignedStaff: "Jay", date: iso(-10), time: "11:00", priceQuoted: 380, depositPaid: 0, materialsCost: 180, finalInvoice: 380, status: "Paid" },
];

export const quotes: Quote[] = [
  { id: "q1", number: "SW-1042", customer: "James O'Connor", work: "Kitchen sink leak repair under unit", price: 180, terms: "Payment on completion. Parts included.", expiry: iso(14), status: "Sent" },
  { id: "q2", number: "SW-1043", customer: "Sophie Edwards", work: "Supply & install new combi boiler (Worcester Bosch 30i)", price: 2750, terms: "50% deposit. 10 year warranty included.", expiry: iso(21), status: "Draft" },
  { id: "q3", number: "SW-1041", customer: "Robert McAllister", work: "Full system power flush", price: 540, terms: "Payment on completion.", expiry: iso(7), status: "Sent" },
  { id: "q4", number: "SW-1040", customer: "Daniel Wright", work: "Bathroom refit — full supply & install", price: 4800, terms: "30% deposit on booking, balance on completion.", expiry: iso(-2), status: "Accepted" },
  { id: "q5", number: "SW-1039", customer: "Aisha Khan", work: "Outside drain unblock", price: 140, terms: "Payment on completion.", expiry: iso(-12), status: "Accepted" },
];

export const expenses: Expense[] = [
  { id: "e1", date: iso(-2), category: "Materials", description: "Wickes — copper pipe & fittings", amount: 184 },
  { id: "e2", date: iso(-3), category: "Fuel", description: "Diesel — van", amount: 92 },
  { id: "e3", date: iso(-5), category: "Materials", description: "Plumb Center — bathroom suite", amount: 1240 },
  { id: "e4", date: iso(-6), category: "Tools", description: "New press fitting tool", amount: 380 },
  { id: "e5", date: iso(-8), category: "Marketing", description: "Facebook ads", amount: 60 },
  { id: "e6", date: iso(-10), category: "Materials", description: "Radiators x2", amount: 220 },
  { id: "e7", date: iso(-12), category: "Fuel", description: "Diesel — van", amount: 88 },
  { id: "e8", date: iso(-15), category: "Labour", description: "Subcontract — tiler (1 day)", amount: 220 },
  { id: "e9", date: iso(-18), category: "Misc", description: "Parking + congestion", amount: 24 },
  { id: "e10", date: iso(-20), category: "Materials", description: "Worcester boiler (stock)", amount: 1180 },
];

export const monthlyRevenue = [
  { month: "Nov", revenue: 8400, expenses: 3100 },
  { month: "Dec", revenue: 7200, expenses: 2800 },
  { month: "Jan", revenue: 9600, expenses: 3900 },
  { month: "Feb", revenue: 11200, expenses: 4400 },
  { month: "Mar", revenue: 14800, expenses: 5700 },
  { month: "Apr", revenue: 12450, expenses: 4820 },
];

export const jobCompletionWeekly = [
  { week: "W1", completed: 6 },
  { week: "W2", completed: 9 },
  { week: "W3", completed: 7 },
  { week: "W4", completed: 11 },
];

export const STATUS_ORDER: JobStatus[] = [
  "New Lead",
  "Quote Sent",
  "Awaiting Approval",
  "Booked",
  "In Progress",
  "Completed",
  "Invoiced",
  "Paid",
];

export function statusColor(status: JobStatus): string {
  switch (status) {
    case "New Lead": return "bg-muted text-foreground";
    case "Quote Sent": return "bg-warning/15 text-warning-foreground border border-warning/30";
    case "Awaiting Approval": return "bg-warning/20 text-foreground border border-warning/40";
    case "Booked": return "bg-primary/10 text-primary border border-primary/30";
    case "In Progress": return "bg-primary text-primary-foreground";
    case "Completed": return "bg-success/15 text-success border border-success/30";
    case "Invoiced": return "bg-secondary text-secondary-foreground";
    case "Paid": return "bg-success text-success-foreground";
  }
}

export const TARGET_MONTHLY = 20000;

export const emailTemplates = [
  {
    id: "t1",
    name: "Quote Sent",
    subject: "Your quote from Steady Works",
    body: `Hi [Name],

Please find attached your quote for the requested work.
If you'd like to proceed, simply reply to this email.

Kind regards,
Steady Works`,
  },
  {
    id: "t2",
    name: "Booking Confirmation",
    subject: "Your booking is confirmed — Steady Works",
    body: `Hi [Name],

Your job has been booked for [Date].
We look forward to completing the work for you.

Regards,
Steady Works`,
  },
  {
    id: "t3",
    name: "Invoice Reminder",
    subject: "Friendly invoice reminder — Steady Works",
    body: `Hi [Name],

Just a friendly reminder regarding the outstanding balance for your recent works.
Please let us know once payment has been made.

Thank you,
Steady Works`,
  },
  {
    id: "t4",
    name: "Follow Up",
    subject: "Following up on your quote — Steady Works",
    body: `Hi [Name],

Just checking in regarding the quote sent recently.
Please let us know if you'd like to proceed.

Regards,
Steady Works`,
  },
];

export function gbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

// ============ Tasks ============
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "To Do" | "In Progress" | "Waiting" | "Completed" | "Cancelled";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string; // ISO date
  dueTime?: string;
  repeat?: "None" | "Daily" | "Weekly" | "Monthly";
  relatedTo?: string;
  status: TaskStatus;
  notes?: string;
}

export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Waiting", "Completed", "Cancelled"];

export const tasks: Task[] = [
  { id: "t1", title: "Call Margaret back re: boiler service", priority: "High", assignedTo: "Boss", dueDate: iso(0), dueTime: "10:00", status: "To Do", relatedTo: "Margaret Thompson", repeat: "None" },
  { id: "t2", title: "Send quote to Sophie Edwards (combi boiler)", priority: "Urgent", assignedTo: "Boss", dueDate: iso(0), dueTime: "14:00", status: "In Progress", relatedTo: "SW-1043", repeat: "None" },
  { id: "t3", title: "Order materials — Wright bathroom refit", description: "Tiles, adhesive, grout, suite", priority: "High", assignedTo: "Tom", dueDate: iso(1), dueTime: "08:00", status: "To Do", relatedTo: "Daniel Wright", repeat: "None" },
  { id: "t4", title: "Chase unpaid invoice — INV-1029", priority: "Medium", assignedTo: "Boss", dueDate: iso(0), status: "Waiting", repeat: "None" },
  { id: "t5", title: "Renew public liability insurance", priority: "Urgent", assignedTo: "Boss", dueDate: iso(7), status: "To Do", repeat: "None" },
  { id: "t6", title: "Book scaffold team — Wigan job", priority: "High", assignedTo: "Jay", dueDate: iso(2), dueTime: "09:00", status: "To Do", relatedTo: "Robert McAllister", repeat: "None" },
  { id: "t7", title: "Staff meeting Friday", description: "Weekly catch-up + jobs review", priority: "Medium", assignedTo: "All", dueDate: iso(((5 - today.getDay()) + 7) % 7 || 7), dueTime: "16:00", status: "To Do", repeat: "Weekly" },
  { id: "t8", title: "Vehicle MOT reminder — van", priority: "Medium", assignedTo: "Boss", dueDate: iso(14), status: "To Do", repeat: "None" },
  { id: "t9", title: "Update website portfolio photos", priority: "Low", assignedTo: "Boss", dueDate: iso(10), status: "To Do", repeat: "None" },
  { id: "t10", title: "Reply to Facebook enquiries", priority: "Medium", assignedTo: "Boss", dueDate: iso(0), dueTime: "17:00", status: "To Do", repeat: "Daily" },
  { id: "t11", title: "Confirm tomorrow's bookings with customers", priority: "High", assignedTo: "Boss", dueDate: iso(0), dueTime: "16:30", status: "In Progress", repeat: "Daily" },
  { id: "t12", title: "Pay supplier — Plumb Center", priority: "Medium", assignedTo: "Boss", dueDate: iso(-1), status: "Completed", repeat: "None" },
  { id: "t13", title: "Tidy van + restock consumables", priority: "Low", assignedTo: "Jay", dueDate: iso(-1), status: "Completed", repeat: "Weekly" },
  { id: "t14", title: "Quote follow-up — McAllister power flush", priority: "Medium", assignedTo: "Boss", dueDate: iso(1), status: "To Do", relatedTo: "SW-1041", repeat: "None" },
];

export function priorityColor(p: TaskPriority): string {
  switch (p) {
    case "Low": return "bg-muted text-muted-foreground border";
    case "Medium": return "bg-secondary text-secondary-foreground border";
    case "High": return "bg-warning/20 text-foreground border border-warning/40";
    case "Urgent": return "bg-destructive text-destructive-foreground";
  }
}

export function taskStatusColor(s: TaskStatus): string {
  switch (s) {
    case "To Do": return "bg-muted text-foreground";
    case "In Progress": return "bg-primary text-primary-foreground";
    case "Waiting": return "bg-warning/20 text-foreground border border-warning/40";
    case "Completed": return "bg-success text-success-foreground";
    case "Cancelled": return "bg-muted text-muted-foreground line-through";
  }
}

// Unified calendar feed
export interface CalendarItem {
  id: string;
  date: string; // ISO yyyy-mm-dd
  time?: string;
  title: string;
  subtitle?: string;
  type: "Job" | "Task" | "Quote" | "Invoice" | "Meeting" | "Compliance";
}

export function buildCalendarItems(): CalendarItem[] {
  const items: CalendarItem[] = [];
  jobs.forEach((j) => items.push({
    id: `cj-${j.id}`, date: j.date, time: j.time,
    title: `${j.jobType} — ${j.customer}`, subtitle: j.address, type: "Job",
  }));
  tasks.forEach((t) => items.push({
    id: `ct-${t.id}`, date: t.dueDate, time: t.dueTime,
    title: t.title, subtitle: t.assignedTo, type: "Task",
  }));
  quotes.filter(q => q.status === "Sent" || q.status === "Draft").forEach((q) => items.push({
    id: `cq-${q.id}`, date: q.expiry,
    title: `Quote expires — ${q.number}`, subtitle: q.customer, type: "Quote",
  }));
  // Pretend invoices due soon
  items.push({ id: "ci-1", date: iso(2), title: "Invoice INV-1029 due", subtitle: "James O'Connor — £180", type: "Invoice" });
  items.push({ id: "ci-2", date: iso(5), title: "Invoice INV-1031 due", subtitle: "Margaret Thompson — £120", type: "Invoice" });
  items.push({ id: "cm-1", date: iso(((5 - today.getDay()) + 7) % 7 || 7), time: "16:00", title: "Staff meeting", subtitle: "Weekly catch-up", type: "Meeting" });
  items.push({ id: "cc-1", date: iso(7), title: "Public liability renewal", subtitle: "Compliance", type: "Compliance" });
  return items;
}

// ============ Marketing ============
export type LeadSource =
  | "Facebook Ads"
  | "Google Ads"
  | "Instagram"
  | "Leaflets"
  | "Referral"
  | "Repeat Customer"
  | "Organic"
  | "Website"
  | "Cold Outreach"
  | "Local Directory"
  | "Other";

export type LeadStatus = "Pending" | "Won" | "Lost";

export interface MarketingSpend {
  id: string;
  date: string;
  source: LeadSource;
  campaign: string;
  amount: number;
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  source: LeadSource;
  date: string;
  status: LeadStatus;
  jobId?: string;
  revenue: number;
}

export const marketingSpend: MarketingSpend[] = [
  { id: "ms1", date: iso(-2), source: "Facebook Ads", campaign: "April Boiler Push", amount: 180, notes: "New creative — boiler service" },
  { id: "ms2", date: iso(-5), source: "Facebook Ads", campaign: "April Boiler Push", amount: 220 },
  { id: "ms3", date: iso(-8), source: "Facebook Ads", campaign: "Local Awareness", amount: 60 },
  { id: "ms4", date: iso(-3), source: "Google Ads", campaign: "Emergency Plumber MCR", amount: 340, notes: "High-intent keywords" },
  { id: "ms5", date: iso(-9), source: "Google Ads", campaign: "Boiler Repair", amount: 280 },
  { id: "ms6", date: iso(-15), source: "Google Ads", campaign: "Emergency Plumber MCR", amount: 410 },
  { id: "ms7", date: iso(-6), source: "Instagram", campaign: "Bathroom Reels", amount: 90 },
  { id: "ms8", date: iso(-12), source: "Leaflets", campaign: "Bolton 1k Drop", amount: 150, notes: "1,000 leaflets — Bolton estates" },
  { id: "ms9", date: iso(-25), source: "Leaflets", campaign: "Salford Drop", amount: 140 },
  { id: "ms10", date: iso(-4), source: "Local Directory", campaign: "Checkatrade", amount: 65 },
  { id: "ms11", date: iso(-20), source: "Local Directory", campaign: "Yell.com", amount: 80, notes: "Underperforming" },
  { id: "ms12", date: iso(-7), source: "Referral", campaign: "Customer referral reward", amount: 50 },
];

export const leads: Lead[] = [
  // Facebook Ads — decent
  { id: "l1", name: "Karen Whittle", source: "Facebook Ads", date: iso(-1), status: "Won", jobId: "j1", revenue: 120 },
  { id: "l2", name: "Tom Briggs", source: "Facebook Ads", date: iso(-3), status: "Won", revenue: 540 },
  { id: "l3", name: "Liam Foster", source: "Facebook Ads", date: iso(-4), status: "Lost", revenue: 0 },
  { id: "l4", name: "Hannah Reid", source: "Facebook Ads", date: iso(-6), status: "Pending", revenue: 0 },
  { id: "l5", name: "Joe Patel", source: "Facebook Ads", date: iso(-7), status: "Lost", revenue: 0 },
  { id: "l6", name: "Sara Doyle", source: "Facebook Ads", date: iso(-9), status: "Won", revenue: 380 },
  // Google Ads — strong
  { id: "l7", name: "Marcus Bennett", source: "Google Ads", date: iso(-3), status: "Won", jobId: "j7", revenue: 320 },
  { id: "l8", name: "Aisha Khan", source: "Google Ads", date: iso(-2), status: "Won", jobId: "j6", revenue: 140 },
  { id: "l9", name: "Greg Hammond", source: "Google Ads", date: iso(-5), status: "Won", revenue: 890 },
  { id: "l10", name: "Nina Clarke", source: "Google Ads", date: iso(-8), status: "Pending", revenue: 0 },
  { id: "l11", name: "Owen Pritchard", source: "Google Ads", date: iso(-10), status: "Won", revenue: 620 },
  { id: "l12", name: "Eve Martinez", source: "Google Ads", date: iso(-14), status: "Lost", revenue: 0 },
  // Referral — gold
  { id: "l13", name: "Daniel Wright", source: "Referral", date: iso(-12), status: "Won", jobId: "j2", revenue: 4800 },
  { id: "l14", name: "Robert McAllister", source: "Referral", date: iso(-15), status: "Won", jobId: "j4", revenue: 620 },
  { id: "l15", name: "Beth Sallow", source: "Referral", date: iso(-6), status: "Won", revenue: 890 },
  // Repeat
  { id: "l16", name: "Margaret Thompson", source: "Repeat Customer", date: iso(-7), status: "Won", jobId: "j10", revenue: 160 },
  { id: "l17", name: "James O'Connor", source: "Repeat Customer", date: iso(-10), status: "Won", jobId: "j12", revenue: 380 },
  // Organic / Website
  { id: "l18", name: "Priya Shah", source: "Organic", date: iso(-1), status: "Won", jobId: "j5", revenue: 95 },
  { id: "l19", name: "Sophie Edwards", source: "Website", date: iso(-2), status: "Pending", revenue: 0 },
  { id: "l20", name: "Adam Black", source: "Organic", date: iso(-4), status: "Won", revenue: 240 },
  // Instagram — meh
  { id: "l21", name: "Chloe Wells", source: "Instagram", date: iso(-6), status: "Pending", revenue: 0 },
  { id: "l22", name: "Ryan O'Neil", source: "Instagram", date: iso(-8), status: "Lost", revenue: 0 },
  // Leaflets — poor
  { id: "l23", name: "Pat Holden", source: "Leaflets", date: iso(-10), status: "Lost", revenue: 0 },
  { id: "l24", name: "Bev Clarke", source: "Leaflets", date: iso(-22), status: "Won", revenue: 180 },
  // Local Directory
  { id: "l25", name: "Frank Riley", source: "Local Directory", date: iso(-5), status: "Won", revenue: 290 },
  { id: "l26", name: "Janet Brooks", source: "Local Directory", date: iso(-18), status: "Lost", revenue: 0 },
  // Cold outreach
  { id: "l27", name: "Mike Jardine", source: "Cold Outreach", date: iso(-14), status: "Lost", revenue: 0 },
];

export function calendarTypeColor(t: CalendarItem["type"]): string {
  switch (t) {
    case "Job": return "bg-primary text-primary-foreground";
    case "Task": return "bg-secondary text-secondary-foreground border";
    case "Quote": return "bg-warning/20 text-foreground border border-warning/40";
    case "Invoice": return "bg-destructive/15 text-destructive border border-destructive/30";
    case "Meeting": return "bg-success/15 text-success border border-success/30";
    case "Compliance": return "bg-muted text-foreground border";
  }
}
