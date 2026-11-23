import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CsrfGuard } from '../auth/guards/csrf.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServerDto } from './dto/create-server.dto';
import { LogsQueryDto } from './dto/logs-query.dto';
import { MetricsQueryDto } from './dto/metrics-query.dto';
import { MetricsDto } from './dto/metrics.dto';
import { AgentKeyGuard } from './guards/agent-key.guard';
import { ServerService } from './server.service';

type AuthenticatedRequest = Request & {
  user: { userId: number; email: string };
};

@Controller('servers')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, CsrfGuard)
  createServer(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateServerDto,
  ) {
    return this.serverService.createServer(request.user.userId, body.name);
  }

  @Post(':id/agent-key')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  issueAgentKey(
    @Req() request: AuthenticatedRequest,
    @Param('id') agentId: string,
  ) {
    return this.serverService.issueAgentKey(request.user.userId, agentId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllServers(@Req() request: AuthenticatedRequest) {
    return this.serverService.getAllServers(request.user.userId);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  getDashboardSummary(@Req() request: AuthenticatedRequest) {
    return this.serverService.getDashboardSummary(request.user.userId);
  }

  @Get(':id/metrics/latest')
  @UseGuards(JwtAuthGuard)
  getLatestMetric(
    @Req() request: AuthenticatedRequest,
    @Param('id') agentId: string,
  ) {
    return this.serverService.getLatestMetric(request.user.userId, agentId);
  }

  @Get(':id/metrics')
  @UseGuards(JwtAuthGuard)
  getServerMetrics(
    @Req() request: AuthenticatedRequest,
    @Param('id') agentId: string,
    @Query() query: MetricsQueryDto,
  ) {
    return this.serverService.getServerMetrics(
      request.user.userId,
      agentId,
      query,
    );
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  getServerLogs(
    @Req() request: AuthenticatedRequest,
    @Param('id') agentId: string,
    @Query() query: LogsQueryDto,
  ) {
    return this.serverService.getServerLogs(
      request.user.userId,
      agentId,
      query,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getServerByAgentId(
    @Req() request: AuthenticatedRequest,
    @Param('id') agentId: string,
  ) {
    return this.serverService.getServerByAgentId(request.user.userId, agentId);
  }

  @Post(':id/metrics')
  @UseGuards(AgentKeyGuard)
  receiveMetrics(@Param('id') agentId: string, @Body() data: MetricsDto) {
    return this.serverService.receiveMetrics(agentId, data);
  }
}
