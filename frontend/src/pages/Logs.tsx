import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Info, RefreshCw, FileText, Activity, Server } from "lucide-react";

import { ServerSelector } from "../components/common/ServerSelector";
import { ExplorerSummaryCard as SummaryCard } from "../components/common/ExplorerSummaryCard";
import { useServers } from "../hooks/useServers";
import { useSelectedServer } from "../hooks/useSelectedServer";
import { useServerLogs } from "../hooks/useServerLogs";
import { LogsTableSection } from "../features/logs/components/LogsTableSection";

export default function Logs() {
  const { servers, loading: serversLoading, error: serversError } = useServers();
  const { selectedServer, selectedAgentId, setSelectedAgentId } = useSelectedServer(servers);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [page, setPage] = useState(0);
  const [rangeAnchor, setRangeAnchor] = useState(() => Date.now());
  const pageSize = 100;

  const dateRange = useMemo(() => {
    const to = new Date(rangeAnchor);
    const duration = timeRange === "1h" ? 60 * 60 * 1000
      : timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
    return {
      from: new Date(to.getTime() - duration).toISOString(),
      to: to.toISOString(),
    };
  }, [timeRange, rangeAnchor]);

  const { logs, total, stats, channels, loading, error, refresh } = useServerLogs(
    selectedAgentId,
    { search, level: levelFilter, channel: channelFilter, ...dateRange, skip: page * pageSize },
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : page * pageSize + 1;
  const lastItem = Math.min((page + 1) * pageSize, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Logs Explorer</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Explore system events from your selected server. The default time range is the last 24 hours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ServerSelector servers={servers} selectedAgentId={selectedAgentId}
            onChange={(agentId) => { setSelectedAgentId(agentId); setPage(0); }}
            disabled={serversLoading} />
          <button type="button" onClick={() => { setRangeAnchor(Date.now()); void refresh(); }}
            disabled={loading || !selectedAgentId}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
      </div>

      {serversError && (
        <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{serversError}</p>
      )}

      {selectedServer && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Server className="h-3.5 w-3.5" />
          <span>Showing logs for <strong className="font-medium text-slate-300">{selectedServer.name}</strong>
            {" · "}{selectedServer.hostname}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard title="Total Logs" value={stats.total} icon={<Activity className="h-5 w-5 text-cyan-400" />} iconBg="bg-cyan-500/10" />
        <SummaryCard title="Information" value={stats.information} icon={<Info className="h-5 w-5 text-blue-400" />} iconBg="bg-blue-500/10" />
        <SummaryCard title="Warnings" value={stats.warning} icon={<AlertTriangle className="h-5 w-5 text-yellow-400" />} iconBg="bg-yellow-500/10" />
        <SummaryCard title="Errors" value={stats.errors} icon={<AlertCircle className="h-5 w-5 text-red-400" />} iconBg="bg-red-500/10" />
      </div>

      <LogsTableSection
        logs={logs} total={total} channels={channels} loading={loading}
        serversLoading={serversLoading} serversEmpty={servers.length === 0}
        error={error} serversError={serversError}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(0); }}
        timeRange={timeRange}
        onTimeRangeChange={(value) => { setTimeRange(value); setPage(0); }}
        levelFilter={levelFilter}
        onLevelFilterChange={(value) => { setLevelFilter(value); setPage(0); }}
        channelFilter={channelFilter}
        onChannelFilterChange={(value) => { setChannelFilter(value); setPage(0); }}
        page={page} pageCount={pageCount} firstItem={firstItem} lastItem={lastItem}
        platform={selectedServer?.platform}
        emptyMessage={stats.total === 0
          ? "No logs have been collected in the selected time range."
          : "No logs match the selected filters."}
        onPageChange={setPage}
        onRefresh={() => void refresh()}
      />
    </div>
  );
}
