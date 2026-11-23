import {
  Box,
  Container,
  Image,
  Network,
} from "lucide-react";
import type { DockerContainer } from "../../../lib/api";
import { formatDockerPorts, getDockerContainerStatus } from "../utils/docker";

interface DockerContainerCardProps {
  container: DockerContainer;
}

export function DockerContainerCard({ container }: DockerContainerCardProps) {
  const status = getDockerContainerStatus(container);
  const isRunning = status === "running";
  const isExited = status === "exited";
  const ports = formatDockerPorts(container.ports);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-3">
            <Container className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {container.name || "Unnamed container"}
            </h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              {container.image || "Unknown image"}
            </p>
          </div>
        </div>
        <DockerStatusBadge status={status} isRunning={isRunning} isExited={isExited} />
      </div>

      <div className="mt-5 space-y-4 border-t border-slate-800 pt-4">
        <DetailRow icon={<Image className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />} label="Docker Image">
          <p className="mt-1 break-all text-sm text-slate-300">{container.image || "Unavailable"}</p>
        </DetailRow>
        <DetailRow icon={<Box className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />} label="Container ID">
          <p className="mt-1 break-all font-mono text-xs text-slate-300">{container.id || "Unavailable"}</p>
        </DetailRow>
        <DetailRow icon={<Network className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />} label="Published Ports">
          <p className="mt-1 break-words text-sm leading-relaxed text-slate-300">{ports}</p>
        </DetailRow>
      </div>
    </article>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        {children}
      </div>
    </div>
  );
}

function DockerStatusBadge({
  status,
  isRunning,
  isExited,
}: {
  status: string;
  isRunning: boolean;
  isExited: boolean;
}) {
  const style = isRunning
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : isExited
      ? "border-slate-700 bg-slate-800 text-slate-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-400";
  const dot = isRunning
    ? "bg-emerald-400"
    : isExited
      ? "bg-slate-500"
      : "bg-amber-400";

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
