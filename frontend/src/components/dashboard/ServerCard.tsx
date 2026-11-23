//ServerCard.tsx
import {
  Activity,
  Box,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Terminal,
} from 'lucide-react';

interface Server {
  serverId: number;
  agentId: string;
  name: string;
  hostname: string;
  platform: string | null;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  processCount: number;
  dockerContainerCount: number;
  collectedAt: string | null;
}

interface ServerCardProps {
  server: Server;
}

type UsageStatus = 'healthy' | 'warning' | 'critical';

const getUsageStatus = (value: number): UsageStatus => {
  if (value >= 90) return 'critical';
  if (value >= 75) return 'warning';
  return 'healthy';
};

const usageStyles = {
  healthy: {
    bar: 'bg-emerald-400',
    text: 'text-emerald-400',
  },
  warning: {
    bar: 'bg-amber-400',
    text: 'text-amber-400',
  },
  critical: {
    bar: 'bg-red-400',
    text: 'text-red-400',
  },
};

export function ServerCard({ server }: ServerCardProps) {
  const cpuStatus = getUsageStatus(server.cpu);
  const memoryStatus = getUsageStatus(server.memory);
  const diskStatus = getUsageStatus(server.disk);

  const normalizedStatus = server.status.toLowerCase();
  const isOnline = normalizedStatus === 'online';
  const isStale = normalizedStatus === 'stale';
  const lastReported = server.collectedAt
    ? new Date(server.collectedAt).toLocaleString()
    : 'Never';

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/90">

      {/* Server Header */}
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 transition-transform duration-300 group-hover:scale-105">
            <Network className="h-5 w-5 text-slate-300" />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {server.name}
            </h3>

            <p className="text-sm text-slate-500">
              {server.hostname}
            </p>
          </div>

        </div>

        {/* Status */}
        <span
          className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${
            isOnline
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : isStale
                ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          {isOnline ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          ) : (
            <span className={'h-2 w-2 rounded-full ' + (isStale ? 'bg-amber-400' : 'bg-red-400')} />
          )}

          {isStale ? 'Stale' : server.status}
        </span>

      </div>

      {/* Platform / Agent */}
      <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
        <span>{server.platform}</span>

        <span className="text-slate-700">
          •
        </span>

        <span className="font-mono">
          {server.agentId}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Last report: {lastReported}
      </p>
      {/* Resource Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3">

        <Metric
          icon={Cpu}
          label="CPU"
          value={`${server.cpu}%`}
          progress={server.cpu}
          status={cpuStatus}
        />

        <Metric
          icon={MemoryStick}
          label="Memory"
          value={`${server.memory}%`}
          progress={server.memory}
          status={memoryStatus}
        />

        <Metric
          icon={HardDrive}
          label="Disk"
          value={`${server.disk}%`}
          progress={server.disk}
          status={diskStatus}
        />

        <Metric
          icon={Terminal}
          label="Processes"
          value={server.processCount}
        />

        <Metric
          icon={Box}
          label="Containers"
          value={server.dockerContainerCount}
        />

        <Metric
          icon={Activity}
          label="Status"
          value={server.status}
        />

      </div>

    </div>
  );
}

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  progress?: number;
  status?: UsageStatus;
}

function Metric({
  icon: Icon,
  label,
  value,
  progress,
  status = 'healthy',
}: MetricProps) {
  const progressValue = Math.min(
    Math.max(progress ?? 0, 0),
    100,
  );

  const styles = usageStyles[status];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 transition-colors duration-200 hover:border-slate-700">

      {/* Metric Header */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>

        <span
          className={`text-sm font-semibold ${
            progress !== undefined
              ? styles.text
              : 'text-slate-200'
          }`}
        >
          {value}
        </span>

      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">

          <div
            className={`h-full rounded-full transition-all duration-700 ${styles.bar}`}
            style={{
              width: `${progressValue}%`,
            }}
          />

        </div>
      )}

    </div>
  );
}