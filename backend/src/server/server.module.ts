import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ServerController } from './server.controller';
import { ServerService } from './server.service';
import { AgentKeyGuard } from './guards/agent-key.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ServerController],
  providers: [ServerService, AgentKeyGuard],
})
export class ServerModule {}
