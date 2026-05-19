import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DailyReportsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DailyReportCreateInput) {
    return this.prisma.dailyReport.create({ data });
  }

  async findAll() {
    return this.prisma.dailyReport.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
    });
    if (!report) throw new NotFoundException('Daily report not found');
    return report;
  }

  async update(id: number, data: Prisma.DailyReportUpdateInput) {
    return this.prisma.dailyReport.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.dailyReport.delete({
      where: { id },
    });
  }
}
