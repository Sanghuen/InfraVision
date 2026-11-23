import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
  };
  const jwt = { signAsync: jest.fn() };
  const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') };
  const compareMock = bcrypt.compare as jest.Mock;
  const hashMock = bcrypt.hash as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('rejects an unknown account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login('missing@example.com', 'password'),
    ).rejects.toMatchObject({ status: 401 });
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an incorrect password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
      password: 'hash',
      tokenVersion: 0,
    });
    compareMock.mockResolvedValueOnce(false);

    await expect(
      service.login('admin@example.com', 'wrong'),
    ).rejects.toMatchObject({ status: 401 });
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('returns a signed token, CSRF token, and safe user profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
      password: 'hash',
      tokenVersion: 0,
    });
    compareMock.mockResolvedValueOnce(true);
    jwt.signAsync.mockResolvedValue('signed-jwt');

    const result = await service.login('ADMIN@example.com', 'correct');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        tokenVersion: true,
      },
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'admin@example.com',
      tokenVersion: 0,
    });
    expect(result.accessToken).toBe('signed-jwt');
    expect(result.csrfToken).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
    expect(result.user).toEqual({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it('rejects a password change when the current password is incorrect', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'old-hash' });
    compareMock.mockResolvedValueOnce(false);

    await expect(
      service.changePassword(1, 'wrong-current', 'New-Password-123!'),
    ).rejects.toMatchObject({ status: 401 });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'old-hash' });
    compareMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

    await expect(
      service.changePassword(
        1,
        'Current-Password-123!',
        'Current-Password-123!',
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('hashes the new password and revokes all existing sessions', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'old-hash' });
    compareMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    hashMock.mockResolvedValueOnce('new-password-hash');

    await service.changePassword(
      1,
      'Current-Password-123!',
      'New-Password-123!',
    );

    expect(hashMock).toHaveBeenCalledWith('New-Password-123!', 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        password: 'new-password-hash',
        tokenVersion: { increment: 1 },
      },
    });
  });

  it('increments tokenVersion to revoke existing sessions on logout', async () => {
    prisma.user.update.mockResolvedValue({ id: 1, tokenVersion: 1 });

    await service.logout(1);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { tokenVersion: { increment: 1 } },
    });
  });
});
