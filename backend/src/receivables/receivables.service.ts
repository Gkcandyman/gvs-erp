import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReceivablesService {
  constructor(private prisma: PrismaService) {}

  async findOutstanding() {
    const customers = await this.prisma.client.findMany({
      where: { outstandingAmount: { gt: 0 } },
      orderBy: [{ outstandingAmount: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        address: true,
        zone: true,
        outstandingAmount: true,
        updatedAt: true,
      },
    });

    const totalOutstanding = customers.reduce(
      (sum, customer) => sum + (customer.outstandingAmount || 0),
      0,
    );
    const customersWithBalance = customers.filter(
      (customer) => (customer.outstandingAmount || 0) > 0,
    ).length;

    return {
      customers,
      stats: {
        totalOutstanding,
        customersWithBalance,
        customerCount: customers.length,
      },
    };
  }
}
