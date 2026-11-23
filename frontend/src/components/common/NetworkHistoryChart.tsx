import { Activity, ArrowDownToLine, ArrowUpFromLine, Network as NetworkIcon } from "lucide-react";
import type { MetricHistory } from "../../lib/api";
import { getNetworkInterfaces } from "../../lib/network";

function formatSpeed(mbps: number): string {
  if (!Number.isFinite(mbps) || mbps < 0) return "0 Mbps";
  return mbps >= 1000 ? `${(mbps / 1000).toFixed(2)} Gbps` : `${mbps.toFixed(2)} Mbps`;
}
export function NetworkHistoryChart({
  interfaceName,
  history,
}: {
  interfaceName: string;
  history: MetricHistory[];
}) {
  const chartWidth = 700;
  const chartHeight = 280;

  const paddingLeft = 58;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 42;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Extract cumulative counters from historical metrics
  const rawPoints = history
    .map((metric) => {
      const item = getNetworkInterfaces(metric).find(
        (network) => network.interface === interfaceName,
      );

      if (!item) return null;

      const timestamp = new Date(metric.collectedAt).getTime();
      const received = Number(item.bytes_recv);
      const sent = Number(item.bytes_sent);

      if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(received) ||
        !Number.isFinite(sent)
      ) {
        return null;
      }

      return {
        timestamp,
        received,
        sent,
        collectedAt: metric.collectedAt,
      };
    })
    .filter(
      (
        point,
      ): point is {
        timestamp: number;
        received: number;
        sent: number;
        collectedAt: string;
      } => point !== null,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  // Calculate Mbps from counter differences
  const points: {
    timestamp: number;
    download: number;
    upload: number;
    collectedAt: string;
  }[] = [];

  for (let index = 1; index < rawPoints.length; index++) {
    const previous = rawPoints[index - 1];
    const current = rawPoints[index];

    const elapsedSeconds = (current.timestamp - previous.timestamp) / 1000;

    if (elapsedSeconds <= 0) continue;

    const receivedDiff = current.received - previous.received;
    const sentDiff = current.sent - previous.sent;

    // Skip counter resets instead of displaying negative speed
    if (receivedDiff < 0 || sentDiff < 0) continue;

    const download = (receivedDiff * 8) / elapsedSeconds / 1_000_000;

    const upload = (sentDiff * 8) / elapsedSeconds / 1_000_000;

    points.push({
      timestamp: current.timestamp,
      download,
      upload,
      collectedAt: current.collectedAt,
    });
  }

  const maxSpeed = Math.max(
    1,
    ...points.flatMap((point) => [point.download, point.upload]),
  );

  // Dynamic Y-axis scale
  const axisMax = Math.ceil(maxSpeed * 1.2 * 10) / 10 || 1;

  const getX = (timestamp: number) => {
    const first = points[0]?.timestamp ?? 0;
    const last = points[points.length - 1]?.timestamp ?? 0;
    const range = last - first;

    if (range <= 0) {
      return paddingLeft + plotWidth / 2;
    }

    return paddingLeft + ((timestamp - first) / range) * plotWidth;
  };

  const getY = (speed: number) => {
    return paddingTop + (1 - speed / axisMax) * plotHeight;
  };

  const createPath = (key: "download" | "upload") => {
    return points
      .map((point, index) => {
        const x = getX(point.timestamp);
        const y = getY(point[key]);

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const downloadPath = createPath("download");
  const uploadPath = createPath("upload");

  const firstTimestamp = points[0]?.timestamp ?? 0;
  const lastTimestamp = points[points.length - 1]?.timestamp ?? 0;

  const averageDownload =
    points.length > 0
      ? points.reduce((sum, point) => sum + point.download, 0) / points.length
      : 0;

  const averageUpload =
    points.length > 0
      ? points.reduce((sum, point) => sum + point.upload, 0) / points.length
      : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <NetworkIcon className="h-4 w-4 text-cyan-400" />
            <h3 className="font-semibold text-white">{interfaceName}</h3>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Network traffic over time
          </p>
        </div>

        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
          {points.length} records
        </span>
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span className="text-slate-400">Download</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          <span className="text-slate-400">Upload</span>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
          <Activity className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          Not enough valid historical snapshots to calculate traffic speed. At
          least two valid collection records are required.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mt-4 w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Network traffic history for ${interfaceName}`}
            >
              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const value = axisMax * ratio;
                const y = getY(value);

                return (
                  <g key={ratio}>
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
                      fontSize="11"
                    >
                      {value.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Download Line */}
              {points.length > 1 && (
                <path
                  d={downloadPath}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Upload Line */}
              {points.length > 1 && (
                <path
                  d={uploadPath}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Download Points */}
              {points.map((point, index) => (
                <circle
                  key={`download-${point.timestamp}-${index}`}
                  cx={getX(point.timestamp)}
                  cy={getY(point.download)}
                  r="3.5"
                  fill="#60a5fa"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                >
                  <title>
                    {new Date(point.collectedAt).toLocaleString()}
                    {" — Download: "}
                    {formatSpeed(point.download)}
                  </title>
                </circle>
              ))}

              {/* Upload Points */}
              {points.map((point, index) => (
                <circle
                  key={`upload-${point.timestamp}-${index}`}
                  cx={getX(point.timestamp)}
                  cy={getY(point.upload)}
                  r="3.5"
                  fill="#a78bfa"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                >
                  <title>
                    {new Date(point.collectedAt).toLocaleString()}
                    {" — Upload: "}
                    {formatSpeed(point.upload)}
                  </title>
                </circle>
              ))}

              {/* X Axis Labels */}
              <text
                x={paddingLeft}
                y={chartHeight - 12}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="11"
              >
                {new Date(firstTimestamp).toLocaleString()}
              </text>

              <text
                x={chartWidth - paddingRight}
                y={chartHeight - 12}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {new Date(lastTimestamp).toLocaleString()}
              </text>
            </svg>
          </div>

          {/* Average Speed */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
            <div className="rounded-lg bg-slate-950/50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ArrowDownToLine className="h-4 w-4 text-blue-400" />
                Average Download
              </div>

              <p className="mt-2 text-lg font-bold text-blue-400">
                {formatSpeed(averageDownload)}
              </p>
            </div>

            <div className="rounded-lg bg-slate-950/50 p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ArrowUpFromLine className="h-4 w-4 text-purple-400" />
                Average Upload
              </div>

              <p className="mt-2 text-lg font-bold text-purple-400">
                {formatSpeed(averageUpload)}
              </p>
            </div>
          </div>

          {/* Chart Footer */}
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>From: {new Date(firstTimestamp).toLocaleString()}</span>

            <span>To: {new Date(lastTimestamp).toLocaleString()}</span>
          </div>
        </>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Speed is calculated using cumulative byte differences divided by the
        actual elapsed collection time.
      </p>
    </div>
  );
}
