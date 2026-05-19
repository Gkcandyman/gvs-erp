import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  create(@Body() createDailyReportDto: Prisma.DailyReportCreateInput) {
    return this.dailyReportsService.create(createDailyReportDto);
  }

  @Get()
  findAll() {
    return this.dailyReportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyReportsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDailyReportDto: Prisma.DailyReportUpdateInput) {
    return this.dailyReportsService.update(+id, updateDailyReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyReportsService.remove(+id);
  }
}
