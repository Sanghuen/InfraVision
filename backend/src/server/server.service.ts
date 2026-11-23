import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LogsQueryDto } from './dto/logs-query.dto';
import type { MetricsQueryDto } from './dto/metrics-query.dto';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { MetricsDto } from './dto/metrics.dto';

const publicServerSelect = {
  id: true,
  name: true,
  hostname: true,
  platform: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  agentId: true,
} as const;

function hashAgentKey(agentKey: string): string {
  return createHash('sha256').update(agentKey).digest('hex');
}

function createAgentKey(): string {
  return `iv_agent_${randomBytes(32).toString('base64url')}`;
}

function toUsage(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(toRecord) : [];
}

function summarizeMetric(metric: {
  disk: unknown;
  network: unknown;
  processes: unknown;
  docker: unknown;
}) {
  const partitions = toArray(toRecord(metric.disk).partitions);
  const interfaces = toArray(metric.network);
  const processes = toArray(metric.processes);
  const containers = toArray(metric.docker);

  const runningProcesses = processes.filter(
    (process) => toText(process.status) === 'running',
  );
  const runningContainers = containers.filter((container) => {
    const status = toText(container.status);
    return status.startsWith('up') || status === 'running';
  });
  const exitedContainers = containers.filter((container) =>
    toText(container.status).startsWith('exited'),
  );

  return {
    network: {
      activeInterfaces: interfaces.filter(
        (item) =>
          toUsage(item.bytes_recv) > 0 ||
          toUsage(item.bytes_sent) > 0 ||
          toUsage(item.packets_recv) > 0 ||
          toUsage(item.packets_sent) > 0,
      ).length,
      totalReceived: interfaces.reduce(
        (total, item) => total + toUsage(item.bytes_recv),
        0,
      ),
      totalSent: interfaces.reduce(
        (total, item) => total + toUsage(item.bytes_sent),
        0,
      ),
    },
    storage: {
      totalCapacity: partitions.reduce(
        (total, item) => total + toUsage(item.total),
        0,
      ),
      totalUsed: partitions.reduce(
        (total, item) => total + toUsage(item.used),
        0,
      ),
      totalFree: partitions.reduce(
        (total, item) => total + toUsage(item.free),
        0,
      ),
    },
    processes: {
      total: processes.length,
      running: runningProcesses.length,
      totalCpu: processes.reduce(
        (total, item) => total + toUsage(item.cpu_percent),
        0,
      ),
      totalMemory: processes.reduce(
        (total, item) => total + toUsage(item.memory_mb),
        0,
      ),
    },
    docker: {
      total: containers.length,
      running: runningContainers.length,
      exited: exitedContainers.length,
      other:
        containers.length - runningContainers.length - exitedContainers.length,
    },
  };
}

@Injectable()
export class ServerService {
  constructor(private readonly prisma: PrismaService) {}

  async createServer(ownerId: number, name: string) {
    const agentId = randomUUID();
    const agentKey = createAgentKey();

    const server = await this.prisma.server.create({
      data: {
        name,
        hostname: name,
        status: 'offline',
        agentId,
        agentKeyHash: hashAgentKey(agentKey),
        ownerId,
      },
      select: publicServerSelect,
    });

    return { server, agentKey };
  }

  async issueAgentKey(ownerId: number, agentId: string) {
    const existingServer = await this.prisma.server.findFirst({
      where: { ownerId, agentId },
      select: { id: true },
    });

    if (!existingServer) {
      throw new NotFoundException('Server not found');
    }

    const agentKey = createAgentKey();
    const server = await this.prisma.server.update({
      where: { id: existingServer.id },
      data: { agentKeyHash: hashAgentKey(agentKey) },
      select: publicServerSelect,
    });

    return { server, agentKey };
  }

  async getServerByAgentId(ownerId: number, agentId: string) {
    const server = await this.prisma.server.findFirst({
      where: { ownerId, agentId },
      select: publicServerSelect,
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async getAllServers(ownerId: number) {
    return this.prisma.server.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: publicServerSelect,
    });
  }

  async receiveMetrics(agentId: string, data: MetricsDto) {
    const server = await this.prisma.server.findUnique({
      where: { agentId },
      select: { id: true, agentId: true },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return this.prisma.$transaction(async (transaction) => {
      const metric = await transaction.metric.create({
        data: {
          serverId: server.id,
          cpu: data.cpu ?? {},
          memory: data.memory ?? {},
          disk: data.disk ?? {},
          network: data.network ?? [],
          processes: data.processes ?? [],
          docker: data.docker ?? [],
          collectedAt: data.agent?.timestamp
            ? new Date(data.agent.timestamp)
            : new Date(),
        },
      });

      if (Array.isArray(data.logs) && data.logs.length > 0) {
        await transaction.log.createMany({
          data: data.logs.map((log) => ({
            serverId: server.id,
            recordId: log.recordId,
            timestamp: new Date(log.timestamp),
            level: log.level,
            source: log.source,
            eventId: log.eventId,
            channel: log.channel,
            message: log.message,
          })),
          skipDuplicates: true,
        });
      }

      await transaction.server.update({
        where: { id: server.id },
        data: {
          hostname: data.agent?.hostname || undefined,
          platform: data.agent?.platform || undefined,
          status: 'online',
        },
      });

      return {
        success: true,
        serverId: server.id,
        agentId: server.agentId,
        metricId: metric.id,
        collectedAt: metric.collectedAt,
      };
    });
  }

  async getServerMetrics(
    ownerId: number,
    agentId: string,
    query: MetricsQueryDto = {},
  ) {
    const server = await this.findOwnedServer(ownerId, agentId);
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 60 * 60 * 1000);

    if (from > to) {
      throw new BadRequestException(
        '"from" must be earlier than or equal to "to"',
      );
    }

    return this.prisma.metric.findMany({
      where: {
        serverId: server.id,
        collectedAt: { gte: from, lte: to },
      },
      orderBy: { collectedAt: 'desc' },
      take: query.limit ?? 500,
    });
  }

  async getLatestMetric(ownerId: number, agentId: string) {
    const server = await this.findOwnedServer(ownerId, agentId);
    const metric = await this.prisma.metric.findFirst({
      where: { serverId: server.id },
      orderBy: { collectedAt: 'desc' },
    });

    if (!metric) {
      throw new NotFoundException('No metrics found for this server');
    }

    return {
      ...metric,
      summary: summarizeMetric(metric),
    };
  }

  async getDashboardSummary(ownerId: number) {
    const servers = await this.prisma.server.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        agentId: true,
        name: true,
        hostname: true,
        platform: true,
        status: true,
        metrics: {
          take: 1,
          orderBy: { collectedAt: 'desc' },
          select: {
            cpu: true,
            memory: true,
            disk: true,
            processes: true,
            docker: true,
            collectedAt: true,
          },
        },
      },
    });

    const now = Date.now();
    const staleAfterMs = 60_000;
    return servers.map((server) => {
      const metric = server.metrics[0];
      const collectedAt = metric?.collectedAt ?? null;
      const ageMs = collectedAt
        ? now - new Date(collectedAt).getTime()
        : Infinity;
      const isFresh = ageMs >= 0 && ageMs <= staleAfterMs;
      const cpu = (metric?.cpu ?? {}) as Record<string, unknown>;
      const memory = (metric?.memory ?? {}) as Record<string, unknown>;
      const disk = (metric?.disk ?? {}) as Record<string, unknown>;

      return {
        serverId: server.id,
        agentId: server.agentId,
        name: server.name,
        hostname: server.hostname,
        platform: server.platform,
        status:
          isFresh &&
          ['online', 'connected'].includes(server.status.toLowerCase())
            ? 'online'
            : collectedAt
              ? 'stale'
              : 'offline',
        cpu: toUsage(cpu.usage),
        memory: toUsage(memory.usage),
        disk: toUsage(disk.usage),
        processCount: Array.isArray(metric?.processes)
          ? metric.processes.length
          : 0,
        dockerContainerCount: Array.isArray(metric?.docker)
          ? metric.docker.length
          : 0,
        collectedAt: metric?.collectedAt ?? null,
      };
    });
  }

  async getServerLogs(
    ownerId: number,
    agentId: string,
    query: LogsQueryDto = {},
  ) {
    const server = await this.findOwnedServer(ownerId, agentId);
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 24 * 60 * 60 * 1000);

    if (from > to) {
      throw new BadRequestException(
        '"from" must be earlier than or equal to "to"',
      );
    }

    const search = query.search?.trim();
    const searchConditions = search
      ? [
          { message: { contains: search, mode: 'insensitive' as const } },
          { source: { contains: search, mode: 'insensitive' as const } },
          ...(/^\d+$/.test(search) ? [{ eventId: Number(search) }] : []),
        ]
      : undefined;

    const baseWhere = {
      serverId: server.id,
      timestamp: { gte: from, lte: to },
      ...(query.channel?.trim() ? { channel: query.channel.trim() } : {}),
      ...(searchConditions ? { OR: searchConditions } : {}),
    };
    const normalizedLevel = query.level?.trim().toLowerCase();
    const where = {
      ...baseWhere,
      ...(normalizedLevel && normalizedLevel !== 'all'
        ? {
            level:
              normalizedLevel === 'info' || normalizedLevel === 'information'
                ? { in: ['info', 'information'] }
                : normalizedLevel,
          }
        : {}),
    };

    const [
      items,
      total,
      allMatching,
      information,
      warning,
      errors,
      channelRows,
    ] = await Promise.all([
      this.prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: query.skip ?? 0,
        take: query.limit ?? 200,
      }),
      this.prisma.log.count({ where }),
      this.prisma.log.count({ where: baseWhere }),
      this.prisma.log.count({
        where: { ...baseWhere, level: { in: ['info', 'information'] } },
      }),
      this.prisma.log.count({ where: { ...baseWhere, level: 'warning' } }),
      this.prisma.log.count({
        where: { ...baseWhere, level: { in: ['error', 'critical'] } },
      }),
      this.prisma.log.findMany({
        where: { serverId: server.id, timestamp: { gte: from, lte: to } },
        distinct: ['channel'],
        select: { channel: true },
        orderBy: { channel: 'asc' },
      }),
    ]);

    return {
      items,
      total,
      stats: { total: allMatching, information, warning, errors },
      channels: channelRows.map((row) => row.channel),
    };
  }

  private async findOwnedServer(ownerId: number, agentId: string) {
    const server = await this.prisma.server.findFirst({
      where: { ownerId, agentId },
      select: { id: true },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }
}
