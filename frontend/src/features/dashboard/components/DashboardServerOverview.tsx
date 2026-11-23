import { RefreshCw, Server } from "lucide-react";
import { ServerCard } from "../../../components/dashboard/ServerCard";
import type { ServerSummary as ServerSummaryData } from "../../../types/server";

interface DashboardServerOverviewProps {
  servers: ServerSummaryData[];
  onlineServers: number;
  offlineServers: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardServerOverview({
  servers, onlineServers, offlineServers, refreshing, onRefresh,
}: DashboardServerOverviewProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Server Overview</h2>
          <p className="mt-1 text-sm text-slate-400">Current resource usage across your infrastructure.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />{onlineServers} Online
          </span>
          <span className="text-slate-700">|</span>
          <span>{offlineServers} Offline / Stale</span>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-16 text-center">
          <Server className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 font-semibold text-slate-300">No servers found</h3>
          <p className="mt-2 text-sm text-slate-500">Connect an Agent to begin monitoring your infrastructure.</p>
          <button type="button" onClick={onRefresh} disabled={refreshing}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" />Refresh
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {servers.map((server) => <ServerCard key={server.serverId} server={server} />)}
        </div>
      )}
    </section>
  );
}
