import { Box, RefreshCw, Search, X } from "lucide-react";
import type { DockerContainer } from "../../../lib/api";
import { DockerContainerCard } from "./DockerContainerCard";
import type { DockerSortOption, DockerStatusFilter } from "../hooks/useDockerContainers";

interface DockerContainerSectionProps {
  containers: DockerContainer[];
  filteredContainers: DockerContainer[];
  runningContainers: number;
  exitedContainers: number;
  otherContainers: number;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: DockerStatusFilter;
  onStatusFilterChange: (value: DockerStatusFilter) => void;
  sortBy: DockerSortOption;
  onSortChange: (value: DockerSortOption) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
}

export function DockerContainerSection({
  containers,
  filteredContainers,
  runningContainers,
  exitedContainers,
  otherContainers,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  onRefresh,
}: DockerContainerSectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Container List</h2>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {filteredContainers.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Container information collected from Docker Engine.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search containers..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-9 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-500 sm:w-64"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as DockerStatusFilter)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="exited">Exited</option>
            <option value="other">Other Status</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as DockerSortOption)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-cyan-500"
          >
            <option value="name">Sort: Name</option>
            <option value="status">Sort: Status</option>
            <option value="image">Sort: Image</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-16 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
          <p className="text-sm">Loading containers...</p>
        </div>
      ) : containers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="rounded-2xl bg-slate-800/70 p-4">
            <Box className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-200">No containers found</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            No container records were reported. Docker Engine may be unavailable,
            or no containers may exist on this server.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      ) : filteredContainers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 text-center">
          <Search className="h-8 w-8 text-slate-600" />
          <h3 className="mt-3 font-medium text-slate-300">No matching containers</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or filter settings.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {filteredContainers.map((container) => (
              <DockerContainerCard
                key={container.id || container.name}
                container={container}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/40 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredContainers.length} of {containers.length} containers
            </span>
            <span>
              {runningContainers} running Â· {exitedContainers} exited Â· {otherContainers} other
            </span>
          </div>
        </>
      )}
    </section>
  );
}
