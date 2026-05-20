import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [productCount, packagingStock, activeShipments, customerCount, outstanding] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.aggregate({
          _sum: { stock: true },
          where: { category: { type: 'PACKAGING' } },
        }),
        this.prisma.shipment.count({
          where: { status: 'IN_TRANSIT' },
        }),
        this.prisma.client.count(),
        this.prisma.client.aggregate({
          _sum: { outstandingAmount: true },
        }),
      ]);

    return [
      {
        label: 'Packaging Stock',
        value: `${(packagingStock._sum.stock || 0) / 1000}k`,
        sub: 'Units Available',
        color: '#3b82f6',
      },
      {
        label: 'Quality Compliance',
        value: '100%',
        sub: 'No violations',
        color: '#10b981',
      },
      {
        label: 'Active Shipments',
        value: activeShipments.toString(),
        sub: 'In Transit',
        color: '#f59e0b',
      },
      {
        label: 'Customers',
        value: customerCount.toString(),
        sub: `Rs.${Math.round(outstanding._sum.outstandingAmount || 0).toLocaleString('en-IN')} receivable`,
        color: '#8b5cf6',
      },
    ];
  }

  async getRecentActivities() {
    return this.prisma.shipment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailyMetrics() {
    const db = this.prisma as any;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);

    const formatDateLocal = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        key: formatDateLocal(date),
        label: date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        }),
        sales: 0,
        collections: 0,
        purchases: 0,
      };
    });

    const metricsByDay = new Map(days.map((day) => [day.key, day]));

    const [invoices, receipts, purchases] = await Promise.all([
      db.invoice.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: { amount: true, createdAt: true },
      }),
      db.receipt.findMany({
        where: { date: { gte: startDate } },
        select: { amount: true, date: true },
      }),
      db.purchaseEntry.findMany({
        where: { purchaseDate: { gte: startDate } },
        select: { totalAmount: true, purchaseDate: true },
      }),
    ]);

    invoices.forEach((invoice) => {
      const key = formatDateLocal(invoice.createdAt);
      const day = metricsByDay.get(key);
      if (day) day.sales += invoice.amount || 0;
    });

    receipts.forEach((receipt) => {
      const key = formatDateLocal(receipt.date);
      const day = metricsByDay.get(key);
      if (day) day.collections += receipt.amount || 0;
    });

    purchases.forEach((purchase) => {
      const key = formatDateLocal(purchase.purchaseDate);
      const day = metricsByDay.get(key);
      if (day) day.purchases += purchase.totalAmount || 0;
    });

    const series = Array.from(metricsByDay.values());
    const totals = series.reduce(
      (sum, day) => ({
        sales: sum.sales + day.sales,
        collections: sum.collections + day.collections,
        purchases: sum.purchases + day.purchases,
      }),
      { sales: 0, collections: 0, purchases: 0 },
    );

    return { series, totals };
  }
}
