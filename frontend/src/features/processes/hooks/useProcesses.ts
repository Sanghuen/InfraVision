import { useMemo, useState } from "react";
import type { ProcessInfo } from "../../../lib/api";

export type ProcessStatusFilter = "all" | "running" | "other";
export type ProcessSortOption = "cpu" | "memory" | "name" | "pid";

export function useProcesses(processes: ProcessInfo[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ProcessSortOption>("cpu");

  const filteredProcesses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return processes
      .filter((process) => {
        const matchesSearch =
          String(process.pid).includes(keyword) ||
          (process.name ?? "").toLowerCase().includes(keyword) ||
          (process.username ?? "").toLowerCase().includes(keyword);
        const status = process.status?.toLowerCase() ?? "";
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "running" && status === "running") ||
          (statusFilter === "other" && status !== "running");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "memory":
            return (Number(b.memory_mb) || 0) - (Number(a.memory_mb) || 0);
          case "name":
            return (a.name ?? "").localeCompare(b.name ?? "");
          case "pid":
            return (Number(a.pid) || 0) - (Number(b.pid) || 0);
          case "cpu":
          default:
            return (Number(b.cpu_percent) || 0) - (Number(a.cpu_percent) || 0);
        }
      });
  }, [processes, search, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("cpu");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredProcesses,
    clearFilters,
    hasActiveFilters: search.length > 0 || statusFilter !== "all",
  };
}
