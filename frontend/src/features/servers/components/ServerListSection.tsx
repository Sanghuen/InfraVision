import { Filter, RefreshCw, Search, Server, X } from "lucide-react";
import type { ServerSummary } from "../../../types/server";
import { ServerCard } from "../../../components/servers/ServerCard";

type ServerStatusFilter = "all" | "connected" | "offline";

interface ServerListSectionProps {
  servers: ServerSummary[];
  filteredServers: ServerSummary[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: ServerStatusFilter;
  onStatusFilterChange: (value: ServerStatusFilter) => void;
  onClearFilters: () => void;
  actionLoading: boolean;
  onRotateAgentKey: (agentId: string) => void;
  onRefresh: () => void;
}

export function ServerListSection({
  servers,
  filteredServers,
  loading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  actionLoading,
  onRotateAgentKey,
  onRefresh,
}: ServerListSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Server List</h2>
          <p className="mt-1 text-sm text-slate-400">
            Server information collected by InfraVision Agent.
          </p>
        </div>
        {!loading && (
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-300">{filteredServers.length}</span> of {servers.length} servers
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search server name, hostname, Agent ID or OS..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as ServerStatusFilter)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500/50 sm:w-44"
          >
            <option value="all">All Status</option>
            <option value="connected">Connected</option>
            <option value="offline">Offline / Unknown</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-12 text-slate-400">
          <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />
          <p className="mt-4 text-sm">Loading servers...</p>
        </div>
      ) : servers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
          <Server className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 font-semibold text-slate-300">No servers found</h3>
          <p className="mt-2 text-sm text-slate-500">
            No server information is available yet.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-600" />
          <h3 className="mt-3 font-semibold text-slate-300">No matching servers</h3>
          <p className="mt-2 text-sm text-slate-500">
            Try changing your search or status filter.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredServers.map((server) => (
            <ServerCard
              key={server.serverId}
              server={server}
              actionLoading={actionLoading}
              onRotateAgentKey={onRotateAgentKey}
            />
          ))}
        </div>
      )}
    </section>
  );
}
