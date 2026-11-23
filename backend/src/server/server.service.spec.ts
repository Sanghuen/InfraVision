import { NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ServerService } from './server.service';

type CreateArgs = {
  data: {
    ownerId: number;
    agentId: string;
    status: string;
    agentKeyHash: string;
  };
  select: Record<string, boolean>;
};

type UpdateArgs = {
  data: { agentKeyHash: string };
};

describe('ServerService', () => {
  const prisma = {
    server: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    metric: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    log: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  let service: ServerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServerService(prisma as unknown as PrismaService);
  });

  it('creates a server with a generated agent ID and hashed key', async () => {
    prisma.server.create.mockResolvedValue({
      id: 10,
      name: 'Ubuntu Lab',
      hostname: 'Ubuntu Lab',
      status: 'offline',
      agentId: 'created-agent',
      ownerId: 7,
    });

    const result = await service.createServer(7, 'Ubuntu Lab');
    const createCalls = prisma.server.create.mock.calls as unknown as [
      CreateArgs,
    ][];
    const createArgs = createCalls[0][0];

    expect(result.server.agentId).toBe('created-agent');
    expect(result.agentKey).toMatch(/^iv_agent_/);
    expect(result.server.agentKeyHash).toBeUndefined();
    expect(createArgs.data.ownerId).toBe(7);
    expect(createArgs.data.agentId).toEqual(expect.any(String));
    expect(createArgs.data.status).toBe('offline');
    expect(createArgs.data.agentKeyHash).toBe(
      createHash('sha256').update(result.agentKey).digest('hex'),
    );
    expect(createArgs.select.agentKeyHash).toBeUndefined();
  });

  it('only rotates a key for a server owned by the requesting user', async () => {
    prisma.server.findFirst.mockResolvedValue({ id: 10 });
    prisma.server.update.mockResolvedValue({
      id: 10,
      name: 'Existing server',
      hostname: 'existing-host',
      status: 'online',
      agentId: 'existing-agent',
      ownerId: 7,
    });

    const result = await service.issueAgentKey(7, 'existing-agent');
    const updateCalls = prisma.server.update.mock.calls as unknown as [
      UpdateArgs,
    ][];
    const updateArgs = updateCalls[0][0];

    expect(prisma.server.findFirst).toHaveBeenCalledWith({
      where: { ownerId: 7, agentId: 'existing-agent' },
      select: { id: true },
    });
    expect(result.agentKey).toMatch(/^iv_agent_/);
    expect(updateArgs.data.agentKeyHash).toBe(
      createHash('sha256').update(result.agentKey).digest('hex'),
    );
  });

  it('does not issue a key for another user server', async () => {
    prisma.server.findFirst.mockResolvedValue(null);

    await expect(service.issueAgentKey(7, 'not-owned-agent')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.server.update).not.toHaveBeenCalled();
  });

  it('filters server list by owner', async () => {
    prisma.server.findMany.mockResolvedValue([]);

    await service.getAllServers(7);

    expect(prisma.server.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 7 } }),
    );
  });

  it('blocks another user from reading server details, metrics, and logs', async () => {
    prisma.server.findFirst.mockResolvedValue(null);

    await expect(
      service.getServerByAgentId(7, 'another-users-agent'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.getServerMetrics(7, 'another-users-agent'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.getLatestMetric(7, 'another-users-agent'),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.getServerLogs(7, 'another-users-agent'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.metric.findMany).not.toHaveBeenCalled();
    expect(prisma.metric.findFirst).not.toHaveBeenCalled();
    expect(prisma.log.findMany).not.toHaveBeenCalled();
    expect(prisma.log.count).not.toHaveBeenCalled();
  });

  it('limits metric history to the latest hour by default', async () => {
    prisma.server.findFirst.mockResolvedValue({ id: 10 });
    prisma.metric.findMany.mockResolvedValue([]);

    await service.getServerMetrics(7, 'agent-1');

    const metricCalls = prisma.metric.findMany.mock.calls as unknown as Array<
      [
        {
          where: {
            serverId: number;
            collectedAt: { gte: Date; lte: Date };
          };
          take: number;
        },
      ]
    >;
    const metricQuery = metricCalls[0]?.[0];

    expect(metricQuery.where.serverId).toBe(10);
    expect(metricQuery.where.collectedAt.gte).toBeInstanceOf(Date);
    expect(metricQuery.where.collectedAt.lte).toBeInstanceOf(Date);
    expect(metricQuery.take).toBe(500);
  });

  it('marks servers stale when their last metric is older than one minute', async () => {
    const now = Date.now();
    prisma.server.findMany.mockResolvedValue([
      {
        id: 1,
        agentId: 'fresh-agent',
        name: 'Fresh server',
        hostname: 'fresh-host',
        platform: 'Windows',
        status: 'online',
        metrics: [
          {
            cpu: { usage: 12 },
            memory: { usage: 34 },
            disk: { usage: 56 },
            processes: [],
            docker: [],
            collectedAt: new Date(now - 15_000),
          },
        ],
      },
      {
        id: 2,
        agentId: 'stale-agent',
        name: 'Stale server',
        hostname: 'stale-host',
        platform: 'Linux',
        status: 'online',
        metrics: [
          {
            cpu: { usage: 80 },
            memory: { usage: 70 },
            disk: { usage: 60 },
            processes: [],
            docker: [],
            collectedAt: new Date(now - 120_000),
          },
        ],
      },
      {
        id: 3,
        agentId: 'new-agent',
        name: 'New server',
        hostname: 'new-host',
        platform: null,
        status: 'offline',
        metrics: [],
      },
    ]);

    const result = await service.getDashboardSummary(7);

    expect(result.map((server) => server.status)).toEqual([
      'online',
      'stale',
      'offline',
    ]);
  });

  it('applies server-side log filters and normalizes info level', async () => {
    prisma.server.findFirst.mockResolvedValue({ id: 10 });
    prisma.log.findMany.mockResolvedValue([]);
    prisma.log.count.mockResolvedValue(0);

    await service.getServerLogs(7, 'agent-1', {
      level: 'info',
      channel: 'Journal',
      search: 'network',
      limit: 25,
      skip: 50,
    });

    const logCalls = prisma.log.findMany.mock.calls as unknown as Array<
      [
        {
          where: Record<string, unknown>;
          take: number;
          skip: number;
        },
      ]
    >;
    const itemsQuery = logCalls[0]?.[0];

    expect(itemsQuery.take).toBe(25);
    expect(itemsQuery.skip).toBe(50);
    expect(itemsQuery.where).toMatchObject({
      serverId: 10,
      channel: 'Journal',
      level: { in: ['info', 'information'] },
    });
    expect(itemsQuery.where.OR).toEqual([
      { message: { contains: 'network', mode: 'insensitive' } },
      { source: { contains: 'network', mode: 'insensitive' } },
    ]);
  });
});
