import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

const CSRF_COOKIE_NAME = 'infravision_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    if (SAFE_METHODS.has(method)) return true;

    this.assertTrustedOrigin(request);

    // Login has no CSRF cookie yet; Origin validation protects this endpoint.
    if (request.path === '/auth/login') return true;

    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookieToken = cookies?.[CSRF_COOKIE_NAME];
    const headerToken = request.header(CSRF_HEADER_NAME);

    if (
      typeof cookieToken !== 'string' ||
      typeof headerToken !== 'string' ||
      !this.isValidToken(cookieToken) ||
      !safeEqual(cookieToken, headerToken)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  private assertTrustedOrigin(request: Request): void {
    const expectedOrigin = this.configService.get<string>(
      'FRONTEND_ORIGIN',
      'http://localhost:5173',
    );
    const requestOrigin = request.header('origin');

    if (!requestOrigin || requestOrigin !== expectedOrigin) {
      throw new ForbiddenException('Untrusted request origin');
    }
  }

  private isValidToken(token: string): boolean {
    const [nonce, signature, extra] = token.split('.');
    if (!nonce || !signature || extra !== undefined) return false;

    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const expected = createHmac('sha256', secret).update(nonce).digest('hex');
    return safeEqual(signature, expected);
  }
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
