import { IsArray, IsObject, IsOptional } from 'class-validator';

export class MetricsDto {
  @IsOptional()
  @IsObject()
  agent?: {
    hostname?: string;
    platform?: string;
    platform_version?: string;
    timestamp?: string;
  };

  @IsOptional()
  @IsObject()
  cpu?: Record<string, any>;

  @IsOptional()
  @IsObject()
  memory?: Record<string, any>;

  @IsOptional()
  @IsObject()
  disk?: Record<string, any>;

  @IsOptional()
  @IsArray()
  network?: any[];

  @IsOptional()
  @IsArray()
  processes?: any[];

  @IsOptional()
  @IsArray()
  docker?: any[];

  @IsOptional()
  @IsArray()
  logs?: {
    recordId: number;
    timestamp: string;
    level: string;
    source: string;
    eventId: number;
    channel: string;
    message: string;
  }[];
}
