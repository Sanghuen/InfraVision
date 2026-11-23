import { Clock3, RefreshCw } from "lucide-react";

type RefreshInterval = 0 | 10000 | 30000 | 60000;

interface DashboardHeaderProps {
  onlineServers: number;
  lastUpdated: string | null;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (value: RefreshInterval) => void;
  refreshing: boolean;
  loading: boolean;
  onRefresh: () => void;
}

function formatLastUpdated(date: string | null) {
  if (!date) return "Never";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Unknown";
  return parsedDate.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function DashboardHeader({
  onlineServers, lastUpdated, refreshInterval, onRefreshIntervalChange,
  refreshing, loading, onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${onlineServers > 0 ? "bg-emerald-400" : "bg-slate-500"}`} />
          <p className="text-sm font-medium text-cyan-400">Infrastructure Overview</p>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Monitor your infrastructure from one place.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
          <Clock3 className="h-4 w-4 text-slate-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Updated</p>
            <p className="text-xs font-medium tabular-nums text-slate-300">{formatLastUpdated(lastUpdated)}</p>
          </div>
        </div>

        <select value={refreshInterval}
          onChange={(event) => onRefreshIntervalChange(Number(event.target.value) as RefreshInterval)}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none transition hover:border-slate-700 focus:border-cyan-500">
          <option value={0}>Auto Refresh: Off</option>
          <option value={10000}>Auto Refresh: 10s</option>
          <option value={30000}>Auto Refresh: 30s</option>
          <option value={60000}>Auto Refresh: 1m</option>
        </select>

        <button type="button" onClick={onRefresh} disabled={loading || refreshing}
          className="group inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : "transition-transform duration-500 group-hover:rotate-180"}`} />
          {refreshing ? "Updating..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}

export type { RefreshInterval };
