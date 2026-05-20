import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const db = this.prisma as any;
    return db.purchaseEntry.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async create(data: any) {
    const db = this.prisma as any;
    const productId = Number(data.productId);
    const quantity = Number(data.quantity);
    const unitPrice = Number(data.unitPrice);

    if (!productId || !quantity || quantity <= 0 || !Number.isFinite(unitPrice)) {
      throw new BadRequestException('Product, quantity, and unit price are required');
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
    const totalAmount = quantity * unitPrice;

    return db.$transaction(async (tx) => {
      const purchase = await tx.purchaseEntry.create({
        data: {
          productId,
          quantity,
          unitPrice,
          totalAmount,
          purchaseDate,
          remarks: data.remarks || null,
        },
        include: { product: { include: { category: true } } },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
          price: unitPrice,
        },
      });

      return purchase;
    });
  }

  async remove(id: number) {
    const db = this.prisma as any;
    const purchase = await db.purchaseEntry.findUnique({ where: { id } });
    if (!purchase) throw new NotFoundException('Purchase entry not found');

    return db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: purchase.productId },
        data: { stock: { decrement: purchase.quantity } },
      });

      return tx.purchaseEntry.delete({ where: { id } });
    });
  }
}
