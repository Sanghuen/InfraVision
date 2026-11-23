
import {
  Network as NetworkIcon,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
} from "lucide-react";

import type { NetworkInterface } from "../types/network";
import { NetworkHistoryChart } from "../components/common/NetworkHistoryChart";
import { NetworkInterfacesSection } from "../features/network/components/NetworkInterfacesSection";
import { getNetworkInterfaces } from "../lib/network";
import { useServers } from "../hooks/useServers";
import { useSelectedServer } from "../hooks/useSelectedServer";
import { useLatestMetric } from "../hooks/useLatestMetric";
import { useMetricsHistory } from "../hooks/useMetricsHistory";
import { ExplorerControls } from "../components/common/ExplorerControls";
import { ExplorerLastUpdated } from "../components/common/ExplorerServerInfo";
import { formatBytes } from "../lib/format";
import { ExplorerSummaryCard as SummaryCard } from "../components/common/ExplorerSummaryCard";

// Network chart and historical interface extraction are shared components.
// ==============================
// Network Component
// ==============================

function Network() {
  const { servers, loading: serversLoading, error: serversError } = useServers();
  const { selectedAgentId, setSelectedAgentId } = useSelectedServer(servers);
  const { metric, loading: metricLoading, refreshing, error: metricError, refresh } =
    useLatestMetric(selectedAgentId);
  const { history, loading: historyLoading, error: historyError, refresh: refreshHistory } =
    useMetricsHistory(selectedAgentId);

  const interfaces: NetworkInterface[] = Array.isArray(metric?.network)
    ? metric.network
    : [];
  const loading = serversLoading || metricLoading;
  const error = serversError ?? (metricError ? "Unable to load network information." : null);
  const lastUpdated = metric?.collectedAt ?? null;

  // ==============================
  // Summary Calculations
  // ==============================

  const activeInterfaces = metric?.summary?.network.activeInterfaces ?? 0;
  const totalReceived = metric?.summary?.network.totalReceived ?? 0;
  const totalSent = metric?.summary?.network.totalSent ?? 0;

  // Collect interface names from historical metrics
  const historicalInterfaceNames = Array.from(
    new Set(
      history.flatMap((metric) =>
        getNetworkInterfaces(metric)
          .map((item) => item.interface)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.length > 0,
          ),
      ),
    ),
  ).sort();

  // Refresh both latest and historical metrics.
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
            Network Explorer
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor network interfaces and traffic. Historical data defaults to the last hour.
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
            Unable to load network information
          </p>
          <p className="mt-1 text-sm text-red-400/70">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Interfaces"
          value={interfaces.length}
          icon={<NetworkIcon className="h-5 w-5 text-cyan-400" />}
        />

        <SummaryCard
          title="Interfaces with Traffic"
          value={activeInterfaces}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
        />

        <SummaryCard
          title="Total Received"
          value={formatBytes(totalReceived)}
          icon={<ArrowDownToLine className="h-5 w-5 text-blue-400" />}
        />

        <SummaryCard
          title="Total Sent"
          value={formatBytes(totalSent)}
          icon={<ArrowUpFromLine className="h-5 w-5 text-purple-400" />}
        />
      </div>

      <NetworkInterfacesSection interfaces={interfaces} loading={loading} />
      {/* Network History */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Network History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Historical download and upload traffic for each network interface.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {history.length} snapshots
          </span>
        </div>

        {historyLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading network history...
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <Database className="mx-auto h-9 w-9 text-slate-600" />

            <h3 className="mt-3 font-semibold text-slate-300">
              No network history available
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Historical network data will appear after the agent collects
              metrics containing network information.
            </p>
          </div>
        ) : historicalInterfaceNames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <NetworkIcon className="mx-auto h-9 w-9 text-slate-600" />

            <h3 className="mt-3 font-semibold text-slate-300">
              No historical network interfaces found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Metrics exist, but their network fields are empty. Check the
              network data stored by the agent.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {historicalInterfaceNames.map((name) => (
              <NetworkHistoryChart
                key={name}
                interfaceName={name}
                history={history}
              />
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Read-only monitoring. Traffic speed is calculated from differences
        between cumulative network counters in historical metrics.
      </p>
    </div>
  );
}


export default Network;
