import type { MetricHistory } from "../../lib/api";
export function StorageHistoryChart({
  drive,
  history,
}: {
  drive: string;
  history: MetricHistory[];
}) {
  const chartWidth = 700;
  const chartHeight = 260;

  const paddingLeft = 48;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 42;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = history
    .map((metric) => {
      const partition = metric.disk?.partitions?.find(
        (item) => item.device === drive,
      );

      if (!partition) return null;

      const timestamp = new Date(metric.collectedAt).getTime();
      const usage = Number(partition.usage);

      if (!Number.isFinite(timestamp) || !Number.isFinite(usage)) {
        return null;
      }

      return {
        timestamp,
        usage: Math.min(Math.max(usage, 0), 100),
        collectedAt: metric.collectedAt,
      };
    })
    .filter(
      (
        point,
      ): point is {
        timestamp: number;
        usage: number;
        collectedAt: string;
      } => point !== null,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const firstTimestamp = points[0]?.timestamp ?? 0;
  const lastTimestamp = points[points.length - 1]?.timestamp ?? 0;
  const timeRange = lastTimestamp - firstTimestamp;

  const getX = (timestamp: number) => {
    if (timeRange <= 0) {
      return paddingLeft + plotWidth / 2;
    }

    return paddingLeft + ((timestamp - firstTimestamp) / timeRange) * plotWidth;
  };

  const getY = (usage: number) => {
    return paddingTop + (1 - usage / 100) * plotHeight;
  };

  const path = points
    .map((point, index) => {
      const x = getX(point.timestamp);
      const y = getY(point.usage);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const firstDate =
    points.length > 0 ? new Date(firstTimestamp).toLocaleString() : "";

  const lastDate =
    points.length > 0 ? new Date(lastTimestamp).toLocaleString() : "";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{drive}</h3>

          <p className="mt-1 text-xs text-slate-500">
            Disk utilization over time
          </p>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
          {points.length} records
        </span>
      </div>

      {points.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
          No historical data available for this drive.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mt-5 w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Storage usage history for ${drive}`}
            >
              {/* Horizontal Grid Lines */}
              {[0, 25, 50, 75, 100].map((value) => {
                const y = getY(value);

                return (
                  <g key={value}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="4 5"
                    />

                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="12"
                    >
                      {value}%
                    </text>
                  </g>
                );
              })}

              {/* History Line */}
              {points.length > 1 && (
                <path
                  d={path}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {points.map((point, index) => {
                const x = getX(point.timestamp);
                const y = getY(point.usage);

                return (
                  <circle
                    key={`${point.timestamp}-${index}`}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill="#22d3ee"
                    stroke="#0f172a"
                    strokeWidth="2"
                  >
                    <title>
                      {new Date(point.collectedAt).toLocaleString()}
                      {" — "}
                      {point.usage.toFixed(1)}%
                    </title>
                  </circle>
                );
              })}

              {/* X Axis Labels */}
              <text
                x={paddingLeft}
                y={chartHeight - 12}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="11"
              >
                {new Date(firstTimestamp).toLocaleDateString()}
              </text>

              <text
                x={chartWidth - paddingRight}
                y={chartHeight - 12}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {new Date(lastTimestamp).toLocaleDateString()}
              </text>
            </svg>
          </div>

          {/* Chart Footer */}
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>From: {firstDate}</span>

            <span>To: {lastDate}</span>
          </div>
        </>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Points are positioned by actual collection time. Gaps indicate periods
        without collected data.
      </p>
    </div>
  );
}
