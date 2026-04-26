import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { jobs, gbp, statusColor } from "@/lib/mock-data";

// Approximate lat/lng for the towns referenced in customer addresses (Greater Manchester area)
const TOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  Manchester: { lat: 53.4808, lng: -2.2426 },
  Salford: { lat: 53.4875, lng: -2.2901 },
  Stockport: { lat: 53.4106, lng: -2.1575 },
  Bolton: { lat: 53.5769, lng: -2.4282 },
  Bury: { lat: 53.5933, lng: -2.2966 },
  Wigan: { lat: 53.5448, lng: -2.6318 },
  Rochdale: { lat: 53.6097, lng: -2.1561 },
  Oldham: { lat: 53.5409, lng: -2.1114 },
};

// Bounding box for the map viewport
const BOUNDS = {
  minLat: 53.38,
  maxLat: 53.64,
  minLng: -2.68,
  maxLng: -2.08,
};

const W = 800;
const H = 460;

const project = (lat: number, lng: number) => {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W;
  const y = H - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H;
  return { x, y };
};

// Stable jitter so multiple jobs in the same town don't stack perfectly
const jitter = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const dx = ((h & 0xff) / 255 - 0.5) * 28;
  const dy = (((h >> 8) & 0xff) / 255 - 0.5) * 28;
  return { dx, dy };
};

export function JobsMap() {
  const [active, setActive] = useState<string | null>(null);

  const points = useMemo(() => {
    return jobs
      .map((j) => {
        const town = Object.keys(TOWN_COORDS).find((t) => j.address.includes(t));
        if (!town) return null;
        const { lat, lng } = TOWN_COORDS[town];
        const { x, y } = project(lat, lng);
        const { dx, dy } = jitter(j.id);
        return { job: j, town, x: x + dx, y: y + dy };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, []);

  const townSummary = useMemo(() => {
    const map = new Map<string, number>();
    points.forEach((p) => map.set(p.town, (map.get(p.town) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [points]);

  const activeJob = points.find((p) => p.job.id === active);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            Jobs Map — Greater Manchester
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {townSummary.slice(0, 5).map(([town, count]) => (
              <Badge key={town} variant="secondary" className="text-[10px] font-medium">
                {town} · {count}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-muted/40 via-background to-muted/20">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto block"
            role="img"
            aria-label="Map of job locations"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              </pattern>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </radialGradient>
              <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background grid */}
            <rect width={W} height={H} fill="url(#grid)" />

            {/* Stylised "rivers" / motorway hint */}
            <path
              d="M 50 380 Q 250 300 400 320 T 760 240"
              stroke="var(--color-border)"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              strokeDasharray="4 4"
            />
            <path
              d="M 200 50 Q 320 200 400 240 T 600 420"
              stroke="var(--color-border)"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
              strokeDasharray="4 4"
            />

            {/* Town labels */}
            {Object.entries(TOWN_COORDS).map(([name, { lat, lng }]) => {
              const { x, y } = project(lat, lng);
              return (
                <g key={name}>
                  <circle cx={x} cy={y} r={45} fill="url(#glow)" />
                  <text
                    x={x}
                    y={y - 22}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize="11"
                    fontWeight="600"
                    style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    {name}
                  </text>
                </g>
              );
            })}

            {/* Job pins */}
            {points.map((p, i) => {
              const isActive = active === p.job.id;
              return (
                <motion.g
                  key={p.job.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 15 }}
                  onMouseEnter={() => setActive(p.job.id)}
                  onMouseLeave={() => setActive(null)}
                  style={{ cursor: "pointer" }}
                >
                  {isActive && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={18}
                      fill="var(--color-primary)"
                      opacity="0.2"
                    />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 9 : 7}
                    fill="var(--color-primary)"
                    stroke="var(--color-background)"
                    strokeWidth="2.5"
                    filter="url(#pinShadow)"
                  />
                  <circle cx={p.x} cy={p.y} r={2.5} fill="var(--color-primary-foreground)" />
                </motion.g>
              );
            })}
          </svg>

          {/* Floating tooltip */}
          {activeJob && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-card border rounded-lg shadow-xl p-3 pointer-events-none"
            >
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{activeJob.job.customer}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {activeJob.job.jobType}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {activeJob.job.address}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(activeJob.job.status)}`}
                    >
                      {activeJob.job.status}
                    </span>
                    {activeJob.job.priceQuoted > 0 && (
                      <span className="text-xs font-bold tabular-nums">
                        {gbp(activeJob.job.priceQuoted)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border rounded-md px-2.5 py-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Active job · {points.length} pinned
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
