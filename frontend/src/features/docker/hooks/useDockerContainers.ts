import { useMemo, useState } from "react";
import type { DockerContainer } from "../../../lib/api";
import { formatDockerPorts, getDockerContainerStatus } from "../utils/docker";

export type DockerStatusFilter = "all" | "running" | "exited" | "other";
export type DockerSortOption = "name" | "status" | "image";

export function useDockerContainers(containers: DockerContainer[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DockerStatusFilter>("all");
  const [sortBy, setSortBy] = useState<DockerSortOption>("name");

  const filteredContainers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return containers
      .filter((container) => {
        const status = getDockerContainerStatus(container);
        const ports = formatDockerPorts(container.ports);
        const matchesSearch =
          (container.name ?? "").toLowerCase().includes(keyword) ||
          (container.id ?? "").toLowerCase().includes(keyword) ||
          (container.image ?? "").toLowerCase().includes(keyword) ||
          status.includes(keyword) ||
          ports.toLowerCase().includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "running" && status === "running") ||
          (statusFilter === "exited" && status === "exited") ||
          (statusFilter === "other" && status !== "running" && status !== "exited");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "image":
            return (a.image ?? "").localeCompare(b.image ?? "");
          case "status":
            return getDockerContainerStatus(a).localeCompare(getDockerContainerStatus(b));
          case "name":
          default:
            return (a.name ?? "").localeCompare(b.name ?? "");
        }
      });
  }, [containers, search, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("name");
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredContainers,
    clearFilters,
    hasActiveFilters: search.length > 0 || statusFilter !== "all",
  };
}
