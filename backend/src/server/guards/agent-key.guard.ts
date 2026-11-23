import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const agentId = request.params.id;
    const agentKey = request.header('x-agent-key');

    if (typeof agentId !== 'string' || !agentKey) {
      throw new UnauthorizedException('Agent credentials are required');
    }

    const server = await this.prisma.server.findUnique({
      where: { agentId },
      select: { id: true, agentKeyHash: true },
    });

    if (!server?.agentKeyHash) {
      throw new UnauthorizedException('Invalid Agent credentials');
    }

    const receivedHash = createHash('sha256').update(agentKey).digest();
    const storedHash = Buffer.from(server.agentKeyHash, 'hex');

    if (
      storedHash.length !== receivedHash.length ||
      !timingSafeEqual(storedHash, receivedHash)
    ) {
      throw new UnauthorizedException('Invalid Agent credentials');
    }

    return true;
  }
}
