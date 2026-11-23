import { INestApplication, UnauthorizedException } from '@nestjs/common';

jest.mock('../src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CsrfGuard } from '../src/auth/guards/csrf.guard';

describe('Login rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest
              .fn()
              .mockRejectedValue(
                new UnauthorizedException('Invalid credentials'),
              ),
          },
        },
        { provide: ConfigService, useValue: { get: () => 'test' } },
        CsrfGuard,
      ],
    })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows five login attempts per minute and blocks the sixth', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.test', password: 'wrong-password' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.test', password: 'wrong-password' })
      .expect(429);
  });
});
