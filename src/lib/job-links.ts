import { useNavigate } from "@tanstack/react-router";
import { useJobsStore } from "./jobs-store";
import { jobs as seedJobs } from "./mock-data";

export interface ResolveCriteria {
  /** Mock-data id like "j1" — maps to seed-position JOB-#### */
  legacyJobId?: string;
  /** Customer display name */
  customer?: string;
  /** Optional job type to disambiguate when a customer has multiple jobs */
  jobType?: string;
  /** Quote / invoice number (matches against store quote.number / invoice.number) */
  docNumber?: string;
}

export function useResolveJobId() {
  const store = useJobsStore();
  return (c: ResolveCriteria): string | undefined => {
    if (c.legacyJobId) {
      const idx = seedJobs.findIndex((j) => j.id === c.legacyJobId);
      if (idx >= 0) return `JOB-${1001 + idx}`;
    }
    if (c.docNumber) {
      const n = c.docNumber.toLowerCase();
      const j = store.jobs.find(
        (j) =>
          j.quotes.some((q) => q.number.toLowerCase() === n) ||
          j.invoices.some((i) => i.number.toLowerCase() === n),
      );
      if (j) return j.id;
    }
    if (c.customer) {
      const cn = c.customer.toLowerCase();
      const exact = store.jobs.find(
        (j) =>
          j.customerName.toLowerCase() === cn &&
          (!c.jobType || j.jobType.toLowerCase() === c.jobType.toLowerCase()),
      );
      if (exact) return exact.id;
      const byCust = store.jobs.find((j) => j.customerName.toLowerCase() === cn);
      if (byCust) return byCust.id;
    }
    return undefined;
  };
}

export function useOpenJob() {
  const navigate = useNavigate();
  const resolve = useResolveJobId();
  return (criteria: ResolveCriteria): boolean => {
    const id = resolve(criteria);
    if (!id) return false;
    navigate({ to: "/jobs/$jobId", params: { jobId: id } });
    return true;
  };
}
