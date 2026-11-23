import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentKeyGuard } from './agent-key.guard';

describe('AgentKeyGuard', () => {
  const agentKey = 'iv_agent_test-secret';
  const prisma = {
    server: {
      findUnique: jest.fn(),
    },
  };
  let guard: AgentKeyGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AgentKeyGuard(prisma as unknown as PrismaService);
  });

  function context(agentId?: string, suppliedKey?: string): ExecutionContext {
    const request = {
      params: { id: agentId },
      header: (name: string) =>
        name === 'x-agent-key' ? suppliedKey : undefined,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('rejects requests without an Agent Key', async () => {
    await expect(guard.canActivate(context('server-1'))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.server.findUnique).not.toHaveBeenCalled();
  });

  it('accepts a matching key using its stored hash', async () => {
    prisma.server.findUnique.mockResolvedValue({
      id: 1,
      agentKeyHash: createHash('sha256').update(agentKey).digest('hex'),
    });

    await expect(
      guard.canActivate(context('server-1', agentKey)),
    ).resolves.toBe(true);
    expect(prisma.server.findUnique).toHaveBeenCalledWith({
      where: { agentId: 'server-1' },
      select: { id: true, agentKeyHash: true },
    });
  });

  it('rejects an incorrect key', async () => {
    prisma.server.findUnique.mockResolvedValue({
      id: 1,
      agentKeyHash: createHash('sha256').update(agentKey).digest('hex'),
    });

    await expect(
      guard.canActivate(context('server-1', 'wrong-key')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects legacy servers until an Agent Key is issued', async () => {
    prisma.server.findUnique.mockResolvedValue({
      id: 1,
      agentKeyHash: null,
    });

    await expect(
      guard.canActivate(context('server-1', agentKey)),
    ).rejects.toThrow(UnauthorizedException);
  });
});
