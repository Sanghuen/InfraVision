import { useMemo } from "react";
import {
  Activity,
  MemoryStick,
  Terminal,
  Cpu,
  CircleDot,
} from "lucide-react";

import { useServers } from "../hooks/useServers";
import { useSelectedServer } from "../hooks/useSelectedServer";
import { useLatestMetric } from "../hooks/useLatestMetric";
import { useMetricsHistory } from "../hooks/useMetricsHistory";
import { ProcessHistoryChart } from "../components/common/ProcessHistoryChart";
import { ProcessTableSection } from "../features/processes/components/ProcessTableSection";
import { useProcesses } from "../features/processes/hooks/useProcesses";
import { ExplorerControls } from "../components/common/ExplorerControls";
import { ExplorerServerInfo } from "../components/common/ExplorerServerInfo";
import { ExplorerSummaryCard as SummaryCard } from "../components/common/ExplorerSummaryCard";

function Processes() {
  const { servers, loading: serversLoading, error: serversError } = useServers();
  const { selectedServer, selectedAgentId, setSelectedAgentId } =
    useSelectedServer(servers);
  const {
    metric,
    loading: metricLoading,
    refreshing,
    error: metricError,
    refresh,
  } = useLatestMetric(selectedAgentId);

  const { history, loading: historyLoading, error: historyError, refresh: refreshHistory } =
    useMetricsHistory(selectedAgentId);

  const processes = useMemo(
    () => (Array.isArray(metric?.processes) ? metric.processes : []),
    [metric],
  );
  const loading = serversLoading || metricLoading;
  const error = serversError ?? (metricError ? "Unable to load process information." : null);
  const lastUpdated = metric?.collectedAt ?? null;

  const runningCount = metric?.summary?.processes.running ?? 0;
  const otherStatusCount = processes.length - runningCount;
  const totalMemory = metric?.summary?.processes.totalMemory ?? 0;
  const totalCpu = metric?.summary?.processes.totalCpu ?? 0;

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredProcesses,
    clearFilters,
    hasActiveFilters,
  } = useProcesses(processes);

  const handleRefresh = () => {
    void refresh();
    void refreshHistory();
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              Infrastructure
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Process Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor and inspect processes running across your infrastructure.
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
        />
      </div>

      <ExplorerServerInfo server={selectedServer} lastUpdated={lastUpdated} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <CircleDot className="mt-0.5 h-5 w-5 text-red-400" />

            <div>
              <p className="font-medium text-red-400">
                Unable to load process information
              </p>
              <p className="mt-1 text-sm text-red-400/70">{error}</p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 text-sm font-medium text-red-300 underline underline-offset-4 hover:text-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Reported Processes"
          value={processes.length.toLocaleString()}
          description="Up to 10 processes reported by the Agent"
          icon={<Terminal className="h-5 w-5 text-cyan-400" />}
          iconBg="bg-cyan-500/10"
        />

        <SummaryCard
          title="Running in Sample"
          value={runningCount.toLocaleString()}
          description={`${
            processes.length > 0
              ? ((runningCount / processes.length) * 100).toFixed(1)
              : "0.0"
          }% of reported processes`}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          title="CPU Usage (Sample)"
          value={`${totalCpu.toFixed(2)}%`}
          description="Combined CPU usage of reported processes"
          icon={<Cpu className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          title="Memory Usage (Sample)"
          value={`${totalMemory.toFixed(2)} MB`}
          description={`${(totalMemory / 1024).toFixed(2)} GB used by reported processes`}
          icon={<MemoryStick className="h-5 w-5 text-purple-400" />}
          iconBg="bg-purple-500/10"
        />
      </div>

      <ProcessTableSection
        processes={processes}
        filteredProcesses={filteredProcesses}
        runningCount={runningCount}
        otherStatusCount={otherStatusCount}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onRefresh={handleRefresh}
      />
      {/* Process History */}
      {historyLoading ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          Loading process history...
        </section>
      ) : historyError ? (
        <section className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Unable to load process history: {historyError}
        </section>
      ) : (
        <ProcessHistoryChart history={history} />
      )}

      {/* Footer Note */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Read-only monitoring. Process termination and management actions are
          not available.
        </p>
      </div>
    </div>
  );
}


export default Processes;
