import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';

jest.mock('../src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CsrfGuard } from '../src/auth/guards/csrf.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { PrismaService } from '../src/prisma/prisma.service';

const JWT_SECRET = 'test-only-secret-with-enough-length-for-hmac';
const FRONTEND_ORIGIN = 'http://localhost:5173';
const SESSION_COOKIE = 'infravision_session';
const CSRF_COOKIE = 'infravision_csrf';

describe('Authentication integration (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let passwordHash: string;

  const user = {
    id: 42,
    email: 'tester@example.test',
    name: 'Integration Tester',
    password: '',
    tokenVersion: 0,
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const configMock = {
    get: (key: string, fallback?: string) => {
      if (key === 'FRONTEND_ORIGIN') return FRONTEND_ORIGIN;
      if (key === 'NODE_ENV') return 'test';
      return fallback;
    },
    getOrThrow: (key: string) => {
      if (key === 'JWT_SECRET') return JWT_SECRET;
      throw new Error(`Missing test config: ${key}`);
    },
  };

  function cookieValue(setCookie: string[], name: string): string {
    const entry = setCookie.find((value) => value.startsWith(`${name}=`));
    if (!entry) throw new Error(`Missing ${name} cookie`);
    return entry.split(';', 1)[0];
  }

  function cookieToken(cookie: string): string {
    return cookie.slice(cookie.indexOf('=') + 1);
  }

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Correct-Pass-123!', 4);
    user.password = passwordHash;
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string; id?: number } }) =>
        where.email === user.email || where.id === user.id ? { ...user } : null,
    );
    prismaMock.user.update.mockImplementation(() => {
      user.tokenVersion += 1;
      return Promise.resolve({ ...user });
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        CsrfGuard,
        { provide: ThrottlerGuard, useValue: { canActivate: () => true } },
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    jwtService = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    user.tokenVersion = 0;
    prismaMock.user.findUnique.mockImplementation(
      ({ where }: { where: { email?: string; id?: number } }) =>
        where.email === user.email || where.id === user.id ? { ...user } : null,
    );
    prismaMock.user.update.mockImplementation(() => {
      user.tokenVersion += 1;
      return Promise.resolve({ ...user });
    });
  });

  it('rejects login when the Origin header is missing or untrusted', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'Correct-Pass-123!' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ email: user.email, password: 'Correct-Pass-123!' })
      .expect(403);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unknown users and incorrect passwords with a generic 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({ email: 'missing@example.test', password: 'Wrong-Pass-123!' })
      .expect(401)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('Invalid credentials');
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({ email: user.email, password: 'Wrong-Pass-123!' })
      .expect(401)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe('Invalid credentials');
      });
  });

  it('issues HttpOnly session and readable CSRF cookies and returns the user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({
        email: user.email.toUpperCase(),
        password: 'Correct-Pass-123!',
      })
      .expect(201);

    expect(response.body).toEqual({
      user: { id: user.id, email: user.email, name: user.name },
    });

    const cookies = response.headers['set-cookie'] as string[];
    const session = cookies.find((value) =>
      value.startsWith(`${SESSION_COOKIE}=`),
    );
    const csrf = cookies.find((value) => value.startsWith(`${CSRF_COOKIE}=`));

    expect(session).toBeDefined();
    expect(session).toMatch(/HttpOnly/i);
    expect(session).toMatch(/Max-Age=86400/i);
    expect(session).toMatch(/SameSite=Lax/i);
    expect(csrf).toBeDefined();
    expect(csrf).not.toMatch(/HttpOnly/i);
    expect(csrf).toMatch(/Max-Age=86400/i);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: user.email } }),
    );
  });

  it('authenticates the profile with a real JWT from the session cookie', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({ email: user.email, password: 'Correct-Pass-123!' })
      .expect(201);

    const cookies = login.headers['set-cookie'] as string[];
    const sessionCookie = cookieValue(cookies, SESSION_COOKIE);

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Cookie', sessionCookie)
      .expect(200)
      .expect(
        ({ body }: { body: { user: { userId: number; email: string } } }) => {
          expect(body.user).toEqual({ userId: user.id, email: user.email });
        },
      );
  });

  it('rejects missing and expired session tokens', async () => {
    await request(app.getHttpServer()).get('/auth/profile').expect(401);

    const expiredToken = await jwtService.signAsync(
      { sub: user.id, email: user.email, tokenVersion: user.tokenVersion },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Cookie', `${SESSION_COOKIE}=${expiredToken}`)
      .expect(401);
  });

  it('rejects logout requests with an untrusted Origin or invalid CSRF token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', 'https://attacker.example')
      .expect(403);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Cookie', `${CSRF_COOKIE}=invalid.token`)
      .set('x-csrf-token', 'invalid.token')
      .expect(403);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Cookie', `${CSRF_COOKIE}=valid-cookie-token`)
      .set('x-csrf-token', 'different-header-token')
      .expect(403);
  });

  it('changes the password with CSRF protection and revokes the previous session', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({ email: user.email, password: 'Correct-Pass-123!' })
      .expect(201);

    const cookies = login.headers['set-cookie'] as string[];
    const sessionCookie = cookieValue(cookies, SESSION_COOKIE);
    const csrfCookie = cookieValue(cookies, CSRF_COOKIE);
    const csrf = cookieToken(csrfCookie);

    const changed = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Cookie', sessionCookie + '; ' + csrfCookie)
      .set('x-csrf-token', csrf)
      .send({
        currentPassword: 'Correct-Pass-123!',
        newPassword: 'New-Correct-Pass-456!',
      })
      .expect(201);

    expect(changed.body).toEqual({
      success: true,
      message: 'Password changed. Please log in again.',
    });
    expect(user.tokenVersion).toBe(1);

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Cookie', sessionCookie)
      .expect(401);

    const cleared = changed.headers['set-cookie'] as string[];
    expect(
      cleared.find((value) => value.startsWith(SESSION_COOKIE + '=')),
    ).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
    expect(
      cleared.find((value) => value.startsWith(CSRF_COOKIE + '=')),
    ).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
  });

  it('invalidates a previously issued JWT after logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({ email: user.email, password: 'Correct-Pass-123!' })
      .expect(201);

    const cookies = login.headers['set-cookie'] as string[];
    const sessionCookie = cookieValue(cookies, SESSION_COOKIE);
    const csrfCookie = cookieValue(cookies, CSRF_COOKIE);
    const csrf = cookieToken(csrfCookie);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Cookie', `${sessionCookie}; ${csrfCookie}`)
      .set('x-csrf-token', csrf)
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Cookie', sessionCookie)
      .expect(401);

    expect(user.tokenVersion).toBe(1);
  });

  it('clears both cookies after a valid CSRF-protected logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', FRONTEND_ORIGIN)
      .send({ email: user.email, password: 'Correct-Pass-123!' })
      .expect(201);

    const cookies = login.headers['set-cookie'] as string[];
    const sessionCookie = cookieValue(cookies, SESSION_COOKIE);
    const csrfCookie = cookieValue(cookies, CSRF_COOKIE);
    const csrf = cookieToken(csrfCookie);

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Cookie', `${sessionCookie}; ${csrfCookie}`)
      .set('x-csrf-token', csrf)
      .expect(201);

    expect(logout.body).toEqual({ success: true });
    const cleared = logout.headers['set-cookie'] as string[];
    expect(
      cleared.find((value) => value.startsWith(`${SESSION_COOKIE}=`)),
    ).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
    expect(
      cleared.find((value) => value.startsWith(`${CSRF_COOKIE}=`)),
    ).toMatch(/(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
  });
});
