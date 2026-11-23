import { useCallback, useMemo, useState } from "react";
import {
  Server,
  RefreshCw,
  CircleCheck,
  CircleX,
  Plus,
} from "lucide-react";

import {
  AGENT_API_BASE_URL,
  createServer,
  rotateAgentKey,
  type AgentKeyResult,
} from "../lib/api";
import { useServers } from "../hooks/useServers";
import { ServerListSection } from "../features/servers/components/ServerListSection";
import { ServerRegistrationForm } from "../features/servers/components/ServerRegistrationForm";
import { AgentKeyPanel } from "../features/servers/components/AgentKeyPanel";
import { ExplorerSummaryCard as SummaryCard } from "../components/common/ExplorerSummaryCard";

function isServerOnline(status?: string | null) {
  return ["online", "connected"].includes((status || "").toLowerCase());
}

function Servers() {
  const { servers, loading, error: serverError, refreshServers } = useServers();
  const [refreshing, setRefreshing] = useState(false);
  const error = serverError ? "Unable to connect to the server API." : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "connected" | "offline"
  >("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [issuedCredentials, setIssuedCredentials] =
    useState<AgentKeyResult | null>(null);
  const [copied, setCopied] = useState(false);

  const loadServers = useCallback(async () => {
    setRefreshing(true);
    await refreshServers();
    setRefreshing(false);
  }, [refreshServers]);

  const onlineCount = servers.filter((server) =>
    isServerOnline(server.status),
  ).length;

  const offlineCount = servers.length - onlineCount;

  const filteredServers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return servers.filter((server) => {
      const matchesSearch =
        !query ||
        [server.name, server.hostname, server.agentId, server.platform].some(
          (value) => (value || "").toLowerCase().includes(query),
        );

      const online = isServerOnline(server.status);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "connected" && online) ||
        (statusFilter === "offline" && !online);

      return matchesSearch && matchesStatus;
    });
  }, [servers, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const handleCreateServer = async () => {
    if (!newServerName.trim()) return;

    setActionLoading(true);
    setActionError(null);
    setCopied(false);

    try {
      const result = await createServer(newServerName.trim());
      setIssuedCredentials(result);
      setShowCreateForm(false);
      setNewServerName("");
      await loadServers();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to create server.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotateAgentKey = async (agentId: string) => {
    const confirmed = window.confirm(
      "Rotating this Agent Key immediately invalidates the current key. Continue?",
    );
    if (!confirmed) return;

    setActionLoading(true);
    setActionError(null);
    setCopied(false);

    try {
      const result = await rotateAgentKey(agentId);
      setIssuedCredentials(result);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to rotate Agent Key.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const copyAgentConfig = async () => {
    if (!issuedCredentials) return;

    const config = [
      `INFRAVISION_SERVER_ID=${issuedCredentials.server.agentId}`,
      `INFRAVISION_AGENT_KEY=${issuedCredentials.agentKey}`,
      `INFRAVISION_BACKEND_URL=${AGENT_API_BASE_URL}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
    } catch {
      setActionError("Clipboard access was blocked. Copy the values manually.");
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-400">Infrastructure</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Servers
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor your infrastructure servers and system resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setActionError(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            Add Server
          </button>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadServers();
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Updating..." : "Refresh"}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <ServerRegistrationForm
          name={newServerName}
          onNameChange={setNewServerName}
          loading={actionLoading}
          error={actionError}
          onSubmit={() => void handleCreateServer()}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {issuedCredentials && (
        <AgentKeyPanel
          credentials={issuedCredentials}
          copied={copied}
          error={actionError}
          onCopy={() => void copyAgentConfig()}
          onClose={() => {
            setIssuedCredentials(null);
            setCopied(false);
          }}
        />
      )}

      {actionError && !showCreateForm && !issuedCredentials && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {actionError}
        </p>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Servers"
          value={servers.length}
          icon={<Server className="h-5 w-5 text-cyan-400" />}
          description="Registered infrastructure"
        />

        <SummaryCard
          title="Connected"
          value={onlineCount}
          icon={<CircleCheck className="h-5 w-5 text-emerald-400" />}
          description="Online and reporting"
        />

        <SummaryCard
          title="Offline / Unknown"
          value={offlineCount}
          icon={<CircleX className="h-5 w-5 text-slate-400" />}
          description="Not currently connected"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-red-400">{error}</p>
            <p className="mt-1 text-sm text-red-400/70">
              Please check whether the Backend API is running.
            </p>
          </div>

          <button
            onClick={() => {
              setRefreshing(true);
              loadServers();
            }}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )}

      <ServerListSection
        servers={servers}
        filteredServers={filteredServers}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={clearFilters}
        actionLoading={actionLoading}
        onRotateAgentKey={handleRotateAgentKey}
        onRefresh={() => void loadServers()}
      />
    </div>
  );
}

export default Servers;
