import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

jest.mock('../src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { CsrfGuard } from '../src/auth/guards/csrf.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { ServerController } from '../src/server/server.controller';
import { ServerService } from '../src/server/server.service';
import { AgentKeyGuard } from '../src/server/guards/agent-key.guard';

describe('Server authorization (e2e)', () => {
  let app: INestApplication<App>;

  const ownedServer = {
    id: 10,
    name: 'Private server',
    hostname: 'private-host',
    platform: 'Windows',
    status: 'online',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ownerId: 1,
    agentId: 'server-owned-by-a',
  };

  const prismaMock = {
    server: {
      findFirst: jest.fn(({ where }: { where: { ownerId: number } }) =>
        where.ownerId === 1 ? ownedServer : null,
      ),
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        ServerService,
        AgentKeyGuard,
        { provide: PrismaService, useValue: prismaMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const request = context.switchToHttp().getRequest<{
            headers: { cookie?: string };
            user?: { userId: number; email: string };
          }>();
          const isUserA = request.headers.cookie?.includes('user-a-session');
          request.user = isUserA
            ? { userId: 1, email: 'user-a@example.test' }
            : { userId: 2, email: 'user-b@example.test' };
          return true;
        },
      })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.server.findFirst.mockImplementation(
      ({ where }: { where: { ownerId: number } }) =>
        where.ownerId === 1 ? ownedServer : null,
    );
  });

  it('allows the owner to read their server', async () => {
    await request(app.getHttpServer())
      .get('/servers/server-owned-by-a')
      .set('Cookie', 'infravision_session=user-a-session')
      .expect(200)
      .expect(({ body }: { body: { agentId: string } }) => {
        expect(body.agentId).toBe('server-owned-by-a');
      });

    expect(prismaMock.server.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 1, agentId: 'server-owned-by-a' },
      }),
    );
  });

  it.each([
    ['/servers/server-owned-by-a', 'server details'],
    ['/servers/server-owned-by-a/metrics', 'metrics history'],
    ['/servers/server-owned-by-a/metrics/latest', 'latest metrics'],
    ['/servers/server-owned-by-a/logs', 'logs'],
  ])('blocks User B from reading %s (%s)', async (path) => {
    await request(app.getHttpServer())
      .get(path)
      .set('Cookie', 'infravision_session=user-b-session')
      .expect(404);

    expect(prismaMock.server.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 2, agentId: 'server-owned-by-a' },
      }),
    );
    expect(prismaMock.metric.findMany).not.toHaveBeenCalled();
    expect(prismaMock.metric.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.log.findMany).not.toHaveBeenCalled();
    expect(prismaMock.log.count).not.toHaveBeenCalled();
  });

  it('does not expose the removed /users endpoint', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Cookie', 'infravision_session=user-a-session')
      .expect(404);
  });
});
