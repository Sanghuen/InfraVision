import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { CsrfGuard } from './csrf.guard';

type MockRequest = {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};

describe('CsrfGuard', () => {
  const secret = 'test-secret';
  const config = {
    get: jest.fn().mockReturnValue('http://localhost:5173'),
    getOrThrow: jest.fn().mockReturnValue(secret),
  };
  let guard: CsrfGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new CsrfGuard(config as unknown as ConfigService);
  });

  function context(input: MockRequest): ExecutionContext {
    const request = {
      method: 'POST',
      path: '/auth/logout',
      cookies: input.cookies,
      header: (name: string) => input.headers?.[name],
    };
    return {
      switchToHttp: () => ({
        getRequest: () => ({ ...request, ...input }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows safe methods without a CSRF token', () => {
    expect(
      guard.canActivate(context({ method: 'GET', path: '/auth/profile' })),
    ).toBe(true);
  });

  it('rejects an untrusted or missing Origin', () => {
    expect(() =>
      guard.canActivate(
        context({ headers: { origin: 'https://evil.example' } }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows login from the configured frontend Origin', () => {
    expect(
      guard.canActivate(
        context({
          path: '/auth/login',
          headers: { origin: 'http://localhost:5173' },
        }),
      ),
    ).toBe(true);
  });

  it('requires a valid signed double-submit token for logout', () => {
    const nonce = randomBytes(32).toString('hex');
    const signature = createHmac('sha256', secret).update(nonce).digest('hex');
    const token = `${nonce}.${signature}`;

    expect(
      guard.canActivate(
        context({
          path: '/auth/logout',
          headers: {
            origin: 'http://localhost:5173',
            'x-csrf-token': token,
          },
          cookies: { infravision_csrf: token },
        }),
      ),
    ).toBe(true);
  });

  it('rejects a mismatched CSRF header', () => {
    const nonce = randomBytes(32).toString('hex');
    const signature = createHmac('sha256', secret).update(nonce).digest('hex');
    const token = `${nonce}.${signature}`;

    expect(() =>
      guard.canActivate(
        context({
          path: '/auth/logout',
          headers: {
            origin: 'http://localhost:5173',
            'x-csrf-token': 'different-token',
          },
          cookies: { infravision_csrf: token },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
