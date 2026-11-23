import type { DockerContainer } from "../../../lib/api";

export function formatDockerPorts(
  ports: Record<string, unknown> | null | undefined,
): string {
  if (!ports || typeof ports !== "object") {
    return "No published ports";
  }

  const entries = Object.entries(ports);
  if (entries.length === 0) {
    return "No published ports";
  }

  return entries
    .flatMap(([containerPort, value]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return [`${containerPort} (not published)`];
      }

      return value.map((binding: { HostIp?: string; HostPort?: string }) =>
        `${binding.HostIp || "0.0.0.0"}:${binding.HostPort || "-"} -> ${containerPort}`,
      );
    })
    .join(", ");
}

export function getDockerContainerStatus(container: DockerContainer): string {
  return (container.status || "unknown").toLowerCase();
}
