import {
  Box,
  CircleCheck,
  CircleDot,
  CircleX,
  Container,
} from "lucide-react";

import { useServers } from "../hooks/useServers";
import { useSelectedServer } from "../hooks/useSelectedServer";
import { useLatestMetric } from "../hooks/useLatestMetric";
import { useMetricsHistory } from "../hooks/useMetricsHistory";
import { DockerHistoryChart } from "../components/common/DockerHistoryChart";
import { DockerContainerSection } from "../features/docker/components/DockerContainerSection";
import { useDockerContainers } from "../features/docker/hooks/useDockerContainers";
import { ExplorerControls } from "../components/common/ExplorerControls";
import { ExplorerServerInfo } from "../components/common/ExplorerServerInfo";
import { ExplorerSummaryCard as SummaryCard } from "../components/common/ExplorerSummaryCard";

function Docker() {
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

  const containers = Array.isArray(metric?.docker) ? metric.docker : [];
  const loading = serversLoading || metricLoading;
  const error = serversError ?? (metricError ? "Unable to load Docker containers." : null);
  const lastUpdated = metric?.collectedAt ?? null;
  const runningContainers = metric?.summary?.docker.running ?? 0;
  const exitedContainers = metric?.summary?.docker.exited ?? 0;
  const otherContainers = metric?.summary?.docker.other ?? 0;

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredContainers,
    clearFilters,
    hasActiveFilters,
  } = useDockerContainers(containers);

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
            Docker Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Explore and monitor Docker containers across your infrastructure.
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
                Unable to load Docker information
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
          title="Total Containers"
          value={containers.length}
          description="Containers reported by Docker Engine"
          icon={<Container className="h-5 w-5 text-cyan-400" />}
          iconBg="bg-cyan-500/10"
        />

        <SummaryCard
          title="Running"
          value={runningContainers}
          description="Currently running"
          icon={<CircleCheck className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          title="Exited"
          value={exitedContainers}
          description="Stopped containers"
          icon={<CircleX className="h-5 w-5 text-slate-400" />}
          iconBg="bg-slate-700/50"
        />

        <SummaryCard
          title="Other Status"
          value={otherContainers}
          description="Created or other states"
          icon={<Box className="h-5 w-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
        />
      </div>

      <DockerContainerSection
        containers={containers}
        filteredContainers={filteredContainers}
        runningContainers={runningContainers}
        exitedContainers={exitedContainers}
        otherContainers={otherContainers}
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

      {/* Container History */}
      {historyLoading ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          Loading container history...
        </section>
      ) : historyError ? (
        <section className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Unable to load container history: {historyError}
        </section>
      ) : (
        <DockerHistoryChart history={history} />
      )}

      {/* Footer Note */}
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Read-only monitoring. Container start, stop, and delete actions are
          not available.
        </p>
      </div>
    </div>
  );
}


export default Docker;
