import { Link } from "@tanstack/react-router";
import { Briefcase, Copy, ExternalLink, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useJobsStore, jobTotals } from "@/lib/jobs-store";
import { gbp } from "@/lib/mock-data";
import { useResolveJobId } from "@/lib/job-links";

type Size = "xs" | "sm" | "md";

interface BaseProps {
  size?: Size;
  className?: string;
  /** Override label shown inside the badge (e.g. INV-2004). Defaults to the job id. */
  label?: string;
  /** Hide the quick-preview popover. */
  noPreview?: boolean;
}

interface ByIdProps extends BaseProps {
  jobId: string;
}

interface ByResolveProps extends BaseProps {
  jobId?: undefined;
  customer?: string;
  docNumber?: string;
  legacyJobId?: string;
  jobType?: string;
}

export type JobLinkProps = ByIdProps | ByResolveProps;

const sizes: Record<Size, string> = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1",
  sm: "text-xs px-2 py-0.5 gap-1.5",
  md: "text-sm px-2.5 py-1 gap-1.5",
};

export function JobLink(props: JobLinkProps) {
  const { size = "sm", className, label, noPreview } = props;
  const resolve = useResolveJobId();

  const resolved =
    "jobId" in props && props.jobId
      ? props.jobId
      : resolve({
          customer: (props as ByResolveProps).customer,
          docNumber: (props as ByResolveProps).docNumber,
          legacyJobId: (props as ByResolveProps).legacyJobId,
          jobType: (props as ByResolveProps).jobType,
        });

  const displayLabel = label ?? resolved ?? (props as ByResolveProps).docNumber ?? "JOB";

  const badge = (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-mono font-bold tracking-tight border transition-all",
        "bg-primary/10 text-primary border-primary/20",
        "hover:bg-primary/15 hover:border-primary/40 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]",
        sizes[size],
        className,
      )}
    >
      <Briefcase className="h-3 w-3 opacity-70" />
      {displayLabel}
    </span>
  );

  if (!resolved) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toast.info(`No linked Job yet for ${displayLabel}`);
        }}
        className="inline-flex"
      >
        {badge}
      </button>
    );
  }

  const link = (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: resolved }}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex"
    >
      {badge}
    </Link>
  );

  if (noPreview) return link;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>{link}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-80 p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <JobQuickPreview jobId={resolved} />
      </HoverCardContent>
    </HoverCard>
  );
}

function JobQuickPreview({ jobId }: { jobId: string }) {
  const store = useJobsStore();
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) {
    return <div className="p-4 text-sm text-muted-foreground">Job not found.</div>;
  }
  const totals = jobTotals(job);
  const latestInvoice = job.invoices[job.invoices.length - 1];
  const nextAppt = [...job.appointments]
    .filter((a) => new Date(a.date).getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];

  const copyId = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(job.id);
      toast.success(`${job.id} copied`);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div>
      <div className="p-3 bg-primary/5 border-b flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-extrabold text-primary">{job.id}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
              {job.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{job.jobType}</div>
        </div>
        <button
          onClick={copyId}
          className="h-7 w-7 rounded-md hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Copy Job ID"
          type="button"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold truncate">{job.customerName}</span>
        </div>
        {job.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-2">{job.address}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <Stat label="Invoiced" value={gbp(totals.invoiced)} />
          <Stat
            label="Outstanding"
            value={gbp(totals.outstanding)}
            danger={totals.outstanding > 0}
          />
        </div>

        {latestInvoice && (
          <div className="pt-2 border-t">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Latest invoice
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-mono font-bold">{latestInvoice.number}</span>
              <span className="tabular-nums">{gbp(latestInvoice.amount)}</span>
            </div>
          </div>
        )}

        {nextAppt && (
          <div className="pt-2 border-t">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Next appointment
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="truncate">{nextAppt.title}</span>
              <span className="text-muted-foreground tabular-nums">
                {new Date(nextAppt.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
                {nextAppt.time ? ` · ${nextAppt.time}` : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      <Link
        to="/jobs/$jobId"
        params={{ jobId: job.id }}
        className="flex items-center justify-center gap-2 p-2.5 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
      >
        Open Full Job Workspace <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-bold tabular-nums text-sm",
          danger ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
