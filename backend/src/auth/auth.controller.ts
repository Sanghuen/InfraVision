import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

const AUTH_COOKIE_NAME = 'infravision_session';
const CSRF_COOKIE_NAME = 'infravision_csrf';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

@Controller('auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    const options = this.getCookieOptions();

    response.cookie(AUTH_COOKIE_NAME, result.accessToken, {
      ...options,
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
    });
    response.cookie(CSRF_COOKIE_NAME, result.csrfToken, {
      ...options,
      httpOnly: false,
      maxAge: SESSION_MAX_AGE,
    });

    return { user: result.user };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: Request & { user: unknown }) {
    return { user: request.user };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() request: Request & { user: { userId: number } },
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.changePassword(
      request.user.userId,
      body.currentPassword,
      body.newPassword,
    );

    const options = this.getCookieOptions();
    response.clearCookie(AUTH_COOKIE_NAME, { ...options, httpOnly: true });
    response.clearCookie(CSRF_COOKIE_NAME, { ...options, httpOnly: false });
    return { success: true, message: 'Password changed. Please log in again.' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: Request & { user: { userId: number } },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.user.userId);
    const options = this.getCookieOptions();
    response.clearCookie(AUTH_COOKIE_NAME, { ...options, httpOnly: true });
    response.clearCookie(CSRF_COOKIE_NAME, { ...options, httpOnly: false });
    return { success: true };
  }

  private getCookieOptions() {
    return {
      path: '/',
      sameSite: 'lax' as const,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
    };
  }
}
