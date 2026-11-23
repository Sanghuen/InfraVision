import type { DockerContainer, MetricHistory } from "../../lib/api";

interface DockerHistoryPoint {
  timestamp: number;
  collectedAt: string;
  total: number;
  running: number;
  exited: number;
}

function buildPoints(history: MetricHistory[]): DockerHistoryPoint[] {
  return history
    .map((metric) => {
      const timestamp = new Date(metric.collectedAt).getTime();
      const containers: DockerContainer[] = Array.isArray(metric.docker)
        ? metric.docker
        : [];

      if (!Number.isFinite(timestamp) || containers.length === 0) return null;

      const statuses = containers.map((container) =>
        (container.status || "unknown").toLowerCase(),
      );

      return {
        timestamp,
        collectedAt: metric.collectedAt,
        total: containers.length,
        running: statuses.filter(
          (status) => status === "running" || status.startsWith("up"),
        ).length,
        exited: statuses.filter((status) => status.startsWith("exited")).length,
      };
    })
    .filter((point): point is DockerHistoryPoint => point !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function DockerHistoryChart({
  history,
}: {
  history: MetricHistory[];
}) {
  const points = buildPoints(history);

  if (points.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Container History</h2>
          <p className="mt-1 text-sm text-slate-400">
            Historical container counts reported by Docker Engine.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-sm font-medium text-slate-300">
            No container history available
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-slate-500">
            No container records were reported in the selected history window.
            This can mean Docker Engine is unavailable or that no containers
            were present during those snapshots.
          </p>
        </div>
      </section>
    );
  }

  const width = 700;
  const height = 270;
  const left = 48;
  const right = 24;
  const top = 24;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxCount = Math.max(1, ...points.map((point) => point.total));
  const axisMax = Math.max(1, Math.ceil(maxCount * 1.15));
  const first = points[0].timestamp;
  const last = points[points.length - 1].timestamp;
  const range = last - first;

  const getX = (timestamp: number) =>
    range <= 0 ? left + plotWidth / 2 : left + ((timestamp - first) / range) * plotWidth;
  const getY = (value: number) =>
    top + (1 - value / axisMax) * plotHeight;

  const series = [
    { key: "total" as const, label: "Total", stroke: "#22d3ee" },
    { key: "running" as const, label: "Running", stroke: "#34d399" },
    { key: "exited" as const, label: "Exited", stroke: "#94a3b8" },
  ];

  const latest = points[points.length - 1];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Container History</h2>
          <p className="mt-1 text-sm text-slate-400">
            Container counts across collected Docker snapshots.
          </p>
        </div>
        <span className="text-xs text-slate-500">
          {points.length} snapshots · Latest reported: {latest.total} containers
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <div className="flex flex-wrap gap-4">
          {series.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.stroke }} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="mt-4 w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label="Docker container count history"
          >
            {Array.from({ length: 5 }, (_, index) => {
              const value = (axisMax * index) / 4;
              const y = getY(value);
              return (
                <g key={index}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="4 5"
                  />
                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="11"
                  >
                    {value.toFixed(axisMax % 4 === 0 ? 0 : 1)}
                  </text>
                </g>
              );
            })}

            {series.map((item) => {
              const path = points
                .map((point, index) => {
                  const command = index === 0 ? "M" : "L";
                  return `${command} ${getX(point.timestamp)} ${getY(point[item.key])}`;
                })
                .join(" ");

              return (
                <g key={item.key}>
                  {points.length > 1 && (
                    <path
                      d={path}
                      fill="none"
                      stroke={item.stroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {points.map((point, index) => (
                    <circle
                      key={`${point.timestamp}-${item.key}-${index}`}
                      cx={getX(point.timestamp)}
                      cy={getY(point[item.key])}
                      r="3"
                      fill={item.stroke}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    >
                      <title>
                        {new Date(point.collectedAt).toLocaleString()}
                        {" — "}
                        {item.label}: {point[item.key]}
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}

            <text x={left} y={height - 12} textAnchor="start" fill="#94a3b8" fontSize="11">
              {new Date(first).toLocaleTimeString()}
            </text>
            <text
              x={width - right}
              y={height - 12}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="11"
            >
              {new Date(last).toLocaleTimeString()}
            </text>
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
          <span>Latest: {latest.running} running · {latest.exited} exited</span>
          <span>Points are based on reported containers only</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Snapshots with no reported containers are omitted. An empty snapshot
        cannot currently distinguish an idle Docker Engine from an unavailable
        Docker connection.
      </p>
    </section>
  );
}
