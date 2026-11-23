import { Container, Cpu, HardDrive, MemoryStick, Server } from "lucide-react";
import { SummaryCard } from "../../../components/dashboard/SummaryCard";

type UsageStatus = "healthy" | "warning" | "critical";

interface DashboardSummaryProps {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  reportingServerCount: number;
  averageCpu: number | null;
  averageMemory: number | null;
  averageDisk: number | null;
  totalContainers: number;
}

function getUsageStatus(value: number): UsageStatus {
  if (value >= 90) return "critical";
  if (value >= 75) return "warning";
  return "healthy";
}

export function DashboardSummary({
  totalServers, onlineServers, offlineServers, reportingServerCount,
  averageCpu, averageMemory, averageDisk, totalContainers,
}: DashboardSummaryProps) {
  const reportingDescription = reportingServerCount > 0
    ? `Across ${reportingServerCount} reporting servers`
    : "No reporting servers";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Infrastructure Summary</h2>
        <p className="mt-1 text-sm text-slate-400">Overall status and resource utilization.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Servers" value={totalServers} description={`${onlineServers} connected`} icon={Server} status="healthy" />
        <SummaryCard title="Offline / Stale" value={offlineServers} description="No recent Agent report" icon={Server} status={offlineServers > 0 ? "warning" : "healthy"} />
        <SummaryCard title="Average CPU" value={averageCpu === null ? "—" : `${averageCpu.toFixed(1)}%`} description={reportingDescription} icon={Cpu} progress={averageCpu ?? undefined} status={averageCpu === null ? "healthy" : getUsageStatus(averageCpu)} />
        <SummaryCard title="Average Memory" value={averageMemory === null ? "—" : `${averageMemory.toFixed(1)}%`} description={reportingDescription} icon={MemoryStick} progress={averageMemory ?? undefined} status={averageMemory === null ? "healthy" : getUsageStatus(averageMemory)} />
        <SummaryCard title="Average Disk" value={averageDisk === null ? "—" : `${averageDisk.toFixed(1)}%`} description={reportingDescription} icon={HardDrive} progress={averageDisk ?? undefined} status={averageDisk === null ? "healthy" : getUsageStatus(averageDisk)} />
        <SummaryCard title="Docker Containers" value={totalContainers} description="On reporting servers" icon={Container} status="healthy" />
      </div>
    </section>
  );
}
