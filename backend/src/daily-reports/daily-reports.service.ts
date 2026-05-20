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

  async getDailyStats(dateStr: string) {
    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });
    
    const receipts = await this.prisma.receipt.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    const db = this.prisma as any;
    const expenses = await this.prisma.expense.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          }
        }
      });
    let purchases = [];
    try {
      purchases = await db.purchaseEntry.findMany({
        where: {
          purchaseDate: {
            gte: startOfDay,
            lte: endOfDay,
          }
        },
        include: { product: true },
      });
    } catch (error) {
      purchases = [];
    }

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalCollection = receipts.reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const dailyExpenseTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const purchaseExpenseTotal = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);

    return {
      totalSales,
      totalCollection,
      totalExpenses: dailyExpenseTotal + purchaseExpenseTotal,
      expenses: [
        ...purchases.map((purchase) => ({
          name: `Purchase - ${purchase.product?.name || 'Product'} (${purchase.quantity} x ${purchase.unitPrice})`,
          amount: purchase.totalAmount,
          remarks: purchase.remarks || '',
        })),
        ...expenses.map((expense) => ({
          name: expense.category,
          amount: expense.amount,
          remarks: expense.remarks || '',
        })),
      ],
    };
  }
}
