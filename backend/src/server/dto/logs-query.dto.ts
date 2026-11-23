import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LogsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  skip?: number;

  @IsOptional()
  @IsIn(['all', 'info', 'information', 'warning', 'error', 'critical'])
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
