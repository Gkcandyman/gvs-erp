import { Module } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { DailyReportsController } from './daily-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DailyReportsService],
  controllers: [DailyReportsController]
})
export class DailyReportsModule {}
