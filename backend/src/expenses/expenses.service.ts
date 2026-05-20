import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(date?: string) {
    const where = date ? this.getDateWhere(date) : {};
    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.expense.create({
      data: {
        voucherNo: data.voucherNo || `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category: data.category,
        amount: Number(data.amount) || 0,
        date: data.date ? new Date(data.date) : new Date(),
        remarks: data.remarks || null,
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        category: data.category,
        amount: Number(data.amount) || 0,
        date: data.date ? new Date(data.date) : undefined,
        remarks: data.remarks || null,
      },
    });
  }

  async remove(id: number) {
    const found = await this.prisma.expense.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Expense not found');
    return this.prisma.expense.delete({ where: { id } });
  }

  async getByDate(date: string) {
    const expenses = await this.findAll(date);
    const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    return { expenses, totalExpenses };
  }

  private getDateWhere(date: string) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return { date: { gte: start, lte: end } };
  }
}
