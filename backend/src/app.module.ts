import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 1. นำเข้า ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServerModule } from './server/server.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 2. ใส่บรรทัดนี้ไว้บนสุดของ imports
    PrismaModule,
    ServerModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
