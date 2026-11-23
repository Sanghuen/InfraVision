
import {
  HardDrive,
  Database,
  HardDriveDownload,
  HardDriveUpload,
} from "lucide-react";

import { StorageHistoryChart } from "../components/common/StorageHistoryChart";
import { StoragePartitionsSection } from "../features/storage/components/StoragePartitionsSection";
import type { StoragePartition } from "../types/storage";
import { useServers } from "../hooks/useServers";
import { useSelectedServer } from "../hooks/useSelectedServer";
import { useLatestMetric } from "../hooks/useLatestMetric";
import { useMetricsHistory } from "../hooks/useMetricsHistory";
import { ExplorerControls } from "../components/common/ExplorerControls";
import { ExplorerLastUpdated } from "../components/common/ExplorerServerInfo";
import { formatBytes } from "../lib/format";
import { ExplorerSummaryCard as SummaryCard } from "../components/common/ExplorerSummaryCard";

function Storage() {
  const { servers, loading: serversLoading, error: serversError } = useServers();
  const { selectedAgentId, setSelectedAgentId } = useSelectedServer(servers);
  const {
    metric,
    loading: metricLoading,
    refreshing,
    error: metricError,
    refresh,
  } = useLatestMetric(selectedAgentId);
  const {
    history,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useMetricsHistory(selectedAgentId);

  const partitions: StoragePartition[] = Array.isArray(metric?.disk?.partitions)
    ? metric.disk.partitions
    : [];
  const loading = serversLoading || metricLoading;
  const error = serversError ?? (metricError ? "Unable to load storage information." : null);
  const lastUpdated = metric?.collectedAt ?? null;

  // Aggregated storage values are calculated by the Backend.
  const totalCapacity = metric?.summary?.storage.totalCapacity ?? 0;
  const totalUsed = metric?.summary?.storage.totalUsed ?? 0;
  const totalFree = metric?.summary?.storage.totalFree ?? 0;

  const handleRefresh = () => {
    void refresh();
    void refreshHistory();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <p className="text-sm font-medium text-cyan-400">Infrastructure</p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Storage Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor disk partitions and storage utilization. Historical data defaults to the last hour.
          </p>
        </div>

        <ExplorerControls
          servers={servers}
          selectedAgentId={selectedAgentId}
          onServerChange={setSelectedAgentId}
          serversLoading={serversLoading}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          refreshingLabel="Updating"
        />
      </div>

      <ExplorerLastUpdated value={lastUpdated} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="font-medium text-red-400">
            Unable to load storage information
          </p>
          <p className="mt-1 text-sm text-red-400/70">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Drives"
          value={partitions.length}
          icon={<HardDrive className="h-5 w-5 text-cyan-400" />}
        />

        <SummaryCard
          title="Total Capacity"
          value={formatBytes(totalCapacity)}
          icon={<Database className="h-5 w-5 text-blue-400" />}
        />

        <SummaryCard
          title="Used Space"
          value={formatBytes(totalUsed)}
          icon={<HardDriveUpload className="h-5 w-5 text-purple-400" />}
        />

        <SummaryCard
          title="Free Space"
          value={formatBytes(totalFree)}
          icon={<HardDriveDownload className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      <StoragePartitionsSection partitions={partitions} loading={loading} />
      {/* Storage History */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Storage History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Historical disk utilization for each drive.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {history.length} snapshots
          </span>
        </div>

        {historyLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading storage history...
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <Database className="mx-auto h-9 w-9 text-slate-600" />

            <h3 className="mt-3 font-semibold text-slate-300">
              No storage history available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Historical storage data will appear after the agent collects
              metrics.
            </p>
          </div>
        ) : partitions.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-500">
            No current drives are available to display.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {partitions.map((partition, index) => (
              <StorageHistoryChart
                key={`${partition.device}-${index}`}
                drive={partition.device}
                history={history}
              />
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Read-only monitoring. Storage information is collected from the
        operating system through the InfraVision Agent.
      </p>
    </div>
  );
}


// Storage History Chart
export default Storage;
