import type { MetricHistory, ProcessInfo } from "../../lib/api";

interface ProcessHistoryPoint {
  timestamp: number;
  collectedAt: string;
  cpu: number;
  memory: number;
  processCount: number;
}

function buildHistoryPoints(history: MetricHistory[]): ProcessHistoryPoint[] {
  return history
    .map((metric) => {
      const timestamp = new Date(metric.collectedAt).getTime();
      const processes: ProcessInfo[] = Array.isArray(metric.processes)
        ? metric.processes
        : [];

      if (!Number.isFinite(timestamp) || processes.length === 0) return null;

      return {
        timestamp,
        collectedAt: metric.collectedAt,
        cpu: processes.reduce(
          (total, process) => total + (Number(process.cpu_percent) || 0),
          0,
        ),
        memory: processes.reduce(
          (total, process) => total + (Number(process.memory_mb) || 0),
          0,
        ),
        processCount: processes.length,
      };
    })
    .filter((point): point is ProcessHistoryPoint => point !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function formatAxisValue(value: number, unit: string): string {
  return `${value.toFixed(unit === "%" ? 1 : 0)}${unit}`;
}

function HistoryLine({
  title,
  description,
  points,
  valueKey,
  unit,
  stroke,
}: {
  title: string;
  description: string;
  points: ProcessHistoryPoint[];
  valueKey: "cpu" | "memory";
  unit: "%" | " MB";
  stroke: string;
}) {
  const width = 700;
  const height = 250;
  const left = 58;
  const right = 22;
  const top = 22;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxValue = Math.max(1, ...points.map((point) => point[valueKey]));
  const axisMax = Math.ceil(maxValue * 1.15 * 10) / 10 || 1;
  const first = points[0]?.timestamp ?? 0;
  const last = points[points.length - 1]?.timestamp ?? 0;
  const range = last - first;

  const getX = (timestamp: number) =>
    range <= 0
      ? left + plotWidth / 2
      : left + ((timestamp - first) / range) * plotWidth;

  const getY = (value: number) =>
    top + (1 - value / axisMax) * plotHeight;

  const path = points
    .map((point, index) => {
      const x = getX(point.timestamp);
      const y = getY(point[valueKey]);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const average =
    points.length > 0
      ? points.reduce((sum, point) => sum + point[valueKey], 0) / points.length
      : 0;
  const latest = points[points.length - 1]?.[valueKey] ?? 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-white">
            {formatAxisValue(latest, unit)}
          </p>
          <p className="text-xs text-slate-500">Latest sample</p>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
          No process history available.
        </div>
      ) : (
        <>
          <div className="mt-4 w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full"
              role="img"
              aria-label={`${title} history chart`}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = axisMax * ratio;
                const y = getY(value);

                return (
                  <g key={ratio}>
                    <line
                      x1={left}
                      y1={y}
                      x2={width - right}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 5"
                    />
                    <text
                      x={left - 9}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="11"
                    >
                      {formatAxisValue(value, unit)}
                    </text>
                  </g>
                );
              })}

              {points.length > 1 && (
                <path
                  d={path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((point, index) => (
                <circle
                  key={`${point.timestamp}-${index}`}
                  cx={getX(point.timestamp)}
                  cy={getY(point[valueKey])}
                  r="3.5"
                  fill={stroke}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                >
                  <title>
                    {new Date(point.collectedAt).toLocaleString()}
                    {" — "}
                    {formatAxisValue(point[valueKey], unit)}
                  </title>
                </circle>
              ))}

              <text
                x={left}
                y={height - 12}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="11"
              >
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

          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-500">
            <span>Average: {formatAxisValue(average, unit)}</span>
            <span>{points.length} snapshots</span>
          </div>
        </>
      )}
    </div>
  );
}

export function ProcessHistoryChart({
  history,
}: {
  history: MetricHistory[];
}) {
  const points = buildHistoryPoints(history);

  const latestProcessCount = points[points.length - 1]?.processCount ?? 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Process History</h2>
          <p className="mt-1 text-sm text-slate-400">
            Resource usage trends for the processes reported in each snapshot.
          </p>
        </div>
        <span className="text-xs text-slate-500">
          {points.length} snapshots | {latestProcessCount} processes in latest sample
        </span>
      </div>

      {points.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-500">
          Process history will appear after the Agent has collected multiple valid process snapshots.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <HistoryLine
            title="CPU Usage History"
            description="Combined CPU usage of the processes reported in each snapshot."
            points={points}
            valueKey="cpu"
            unit="%"
            stroke="#22d3ee"
          />
          <HistoryLine
            title="Memory Usage History"
            description="Combined memory used by the processes reported in each snapshot."
            points={points}
            valueKey="memory"
            unit=" MB"
            stroke="#a78bfa"
          />
        </div>
      )}

      <p className="text-xs text-slate-500">
        The Agent currently reports up to 10 processes per collection, sorted by CPU usage.
        These charts summarize that reported sample, not every process on the operating system.
      </p>
    </section>
  );
}
