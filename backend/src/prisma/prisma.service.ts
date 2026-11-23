import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'; // นำเข้า Pool จาก pg

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    console.log('[DB CHECK]', {
      hasDatabaseUrl: !!connectionString,
      host: connectionString ? new URL(connectionString).hostname : null,
      port: connectionString ? new URL(connectionString).port : null,
      database: connectionString ? new URL(connectionString).pathname : null,
      username: connectionString ? new URL(connectionString).username : null,
    });

    // ดักไว้หาก DATABASE_URL โหลดไม่สำเร็จ
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined. Check your .env file.');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
