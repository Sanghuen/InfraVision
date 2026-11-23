import { useCallback, useMemo, useState } from "react";
import { useServers } from "../hooks/useServers";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { DashboardHeader, type RefreshInterval } from "../features/dashboard/components/DashboardHeader";
import { DashboardSummary } from "../features/dashboard/components/DashboardSummary";
import { DashboardServerOverview } from "../features/dashboard/components/DashboardServerOverview";

const isServerOnline = (status?: string | null) =>
  ["online", "connected"].includes((status || "").toLowerCase());

const getSafeNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export default function Dashboard() {
  const { servers, loading, error, refreshServers } = useServers();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(0);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshServers();
    } finally {
      setRefreshing(false);
    }
  }, [refreshServers]);

  useAutoRefresh(refreshDashboard, refreshInterval);

  const lastUpdated = useMemo(() => {
    const timestamps = servers
      .map((server) => server.collectedAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite);
    return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;
  }, [servers]);

  const onlineServers = servers.filter((server) => isServerOnline(server.status)).length;
  const offlineServers = servers.length - onlineServers;
  const reportingServers = servers.filter((server) => isServerOnline(server.status));

  const averageCpu = reportingServers.length > 0
    ? reportingServers.reduce((sum, server) => sum + getSafeNumber(server.cpu), 0) / reportingServers.length
    : null;
  const averageMemory = reportingServers.length > 0
    ? reportingServers.reduce((sum, server) => sum + getSafeNumber(server.memory), 0) / reportingServers.length
    : null;
  const averageDisk = reportingServers.length > 0
    ? reportingServers.reduce((sum, server) => sum + getSafeNumber(server.disk), 0) / reportingServers.length
    : null;
  const totalContainers = reportingServers.reduce(
    (sum, server) => sum + getSafeNumber(server.dockerContainerCount), 0,
  );

  const handleRefresh = () => void refreshDashboard();

  return (
    <div className="space-y-7">
      <DashboardHeader onlineServers={onlineServers} lastUpdated={lastUpdated}
        refreshInterval={refreshInterval} onRefreshIntervalChange={setRefreshInterval}
        refreshing={refreshing} loading={loading} onRefresh={handleRefresh} />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-red-400">Unable to load infrastructure</p>
              <p className="mt-1 text-sm text-red-400/70">{error}</p>
            </div>
            <button type="button" onClick={handleRefresh} disabled={refreshing}
              className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
          ))}
        </div>
      ) : (
        <>
          <DashboardSummary totalServers={servers.length} onlineServers={onlineServers}
            offlineServers={offlineServers} reportingServerCount={reportingServers.length}
            averageCpu={averageCpu} averageMemory={averageMemory} averageDisk={averageDisk}
            totalContainers={totalContainers} />
          <DashboardServerOverview servers={servers} onlineServers={onlineServers}
            offlineServers={offlineServers} refreshing={refreshing} onRefresh={handleRefresh} />
        </>
      )}
    </div>
  );
}
