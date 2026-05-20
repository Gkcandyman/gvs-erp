import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PriceHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(clientId?: string, productId?: string) {
    const db = this.prisma as any;
    return db.productPriceHistory.findMany({
      where: {
        ...(clientId ? { clientId: Number(clientId) } : {}),
        ...(productId ? { productId: Number(productId) } : {}),
      },
      include: { client: true, product: true },
      orderBy: { date: 'desc' },
    });
  }
}
