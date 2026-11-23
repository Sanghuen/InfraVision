import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentKeyGuard } from './guards/agent-key.guard';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';

describe('ServerController', () => {
  const serverService = {
    createServer: jest.fn(),
    issueAgentKey: jest.fn(),
    getAllServers: jest.fn(),
    getDashboardSummary: jest.fn(),
    getLatestMetric: jest.fn(),
    getServerMetrics: jest.fn(),
    getServerLogs: jest.fn(),
    getServerByAgentId: jest.fn(),
    receiveMetrics: jest.fn(),
  };
  let controller: ServerController;

  const getMethodGuards = (methodName: string): unknown => {
    const handler = Object.getOwnPropertyDescriptor(
      ServerController.prototype,
      methodName,
    )?.value as object;
    return Reflect.getMetadata(GUARDS_METADATA, handler) as unknown;
  };

  const request = {
    user: { userId: 17, email: 'owner@example.com' },
  } as Parameters<ServerController['createServer']>[0];

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ServerController(
      serverService as unknown as ServerService,
    );
  });

  it('requires JWT and CSRF protection for server creation and key rotation', () => {
    expect(getMethodGuards('createServer')).toEqual([JwtAuthGuard, CsrfGuard]);
    expect(getMethodGuards('issueAgentKey')).toEqual([JwtAuthGuard, CsrfGuard]);
  });

  it('requires JWT protection for every user-facing server read route', () => {
    const protectedMethods = [
      'getAllServers',
      'getDashboardSummary',
      'getLatestMetric',
      'getServerMetrics',
      'getServerLogs',
      'getServerByAgentId',
    ] as const;

    for (const method of protectedMethods) {
      expect(getMethodGuards(method)).toEqual([JwtAuthGuard]);
    }
  });

  it('requires an Agent Key for metric ingestion', () => {
    expect(getMethodGuards('receiveMetrics')).toEqual([AgentKeyGuard]);
  });

  it('passes the authenticated owner ID to server creation and key rotation', () => {
    void controller.createServer(request, { name: 'Lab server' });
    void controller.issueAgentKey(request, 'agent-123');

    expect(serverService.createServer).toHaveBeenCalledWith(17, 'Lab server');
    expect(serverService.issueAgentKey).toHaveBeenCalledWith(17, 'agent-123');
  });

  it('passes the authenticated owner ID to every server read operation', () => {
    void controller.getAllServers(request);
    void controller.getDashboardSummary(request);
    void controller.getServerByAgentId(request, 'agent-123');
    void controller.getLatestMetric(request, 'agent-123');
    void controller.getServerMetrics(request, 'agent-123', { limit: 20 });
    void controller.getServerLogs(request, 'agent-123', { limit: 30 });

    expect(serverService.getAllServers).toHaveBeenCalledWith(17);
    expect(serverService.getDashboardSummary).toHaveBeenCalledWith(17);
    expect(serverService.getServerByAgentId).toHaveBeenCalledWith(
      17,
      'agent-123',
    );
    expect(serverService.getLatestMetric).toHaveBeenCalledWith(17, 'agent-123');
    expect(serverService.getServerMetrics).toHaveBeenCalledWith(
      17,
      'agent-123',
      { limit: 20 },
    );
    expect(serverService.getServerLogs).toHaveBeenCalledWith(17, 'agent-123', {
      limit: 30,
    });
  });

  it('passes agent metrics to the ingestion service', () => {
    const metrics = { cpu: { usage: 12 } };
    void controller.receiveMetrics('agent-123', metrics);

    expect(serverService.receiveMetrics).toHaveBeenCalledWith(
      'agent-123',
      metrics,
    );
  });
});
