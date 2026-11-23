import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    logout: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue(undefined),
    login: jest.fn().mockResolvedValue({
      accessToken: 'jwt-token',
      csrfToken: 'csrf-token',
      user: { id: 1, email: 'admin@example.com', name: 'Admin' },
    }),
  };
  const config = { get: jest.fn().mockReturnValue('development') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: config },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('sets the JWT as HttpOnly and the CSRF token as readable cookie', async () => {
    const response = { cookie: jest.fn() };
    const result = await controller.login(
      { email: 'admin@example.com', password: 'password' },
      response as unknown as Response,
    );

    expect(result).toEqual({
      user: { id: 1, email: 'admin@example.com', name: 'Admin' },
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'infravision_session',
      'jwt-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'infravision_csrf',
      'csrf-token',
      expect.objectContaining({ httpOnly: false, sameSite: 'lax' }),
    );
  });

  it('changes password and clears both cookies so the admin must log in again', async () => {
    const response = { clearCookie: jest.fn() };
    const result = await controller.changePassword(
      { user: { userId: 1 } } as never,
      {
        currentPassword: 'Current-Password-123!',
        newPassword: 'New-Password-123!',
      },
      response as unknown as Response,
    );

    expect(authService.changePassword).toHaveBeenCalledWith(
      1,
      'Current-Password-123!',
      'New-Password-123!',
    );
    expect(result).toEqual({
      success: true,
      message: 'Password changed. Please log in again.',
    });
    expect(response.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('revokes the current account sessions and clears both cookies on logout', async () => {
    const response = { clearCookie: jest.fn() };
    expect(
      await controller.logout(
        { user: { userId: 1 } } as never,
        response as unknown as Response,
      ),
    ).toEqual({
      success: true,
    });
    expect(authService.logout).toHaveBeenCalledWith(1);
    expect(response.clearCookie).toHaveBeenCalledTimes(2);
  });
});
