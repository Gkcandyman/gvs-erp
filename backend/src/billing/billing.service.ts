import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(db: any) {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `INV-${datePart}`;
    const count = await db.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }

  async findAll() {
    const db = this.prisma as any;
    return db.invoice.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const db = this.prisma as any;
    return db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async create(createInvoiceDto: CreateInvoiceDto) {
    const db = this.prisma as any;
    const { dueDate, items, invoiceNumber, ...data } = createInvoiceDto;

    // ── Validate & prepare stock deductions ───────────────────────────────
    const stockUpdates: Array<{ id: number; newStock: number }> = [];
    const pricedProducts: Array<{ productId: number; productName: string; price: number }> = [];

    for (const item of items) {
      let product: any = null;

      if (item.productId) {
        product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
      } else {
        // Fall back to name-based lookup (case-insensitive)
        const results = await this.prisma.product.findMany({
          where: { name: { equals: item.name, mode: 'insensitive' } },
        });
        product = results[0] ?? null;
      }

      if (product) {
        const remaining = product.stock - item.quantity;
        if (remaining < 0) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
        stockUpdates.push({ id: product.id, newStock: remaining });
        pricedProducts.push({ productId: product.id, productName: product.name, price: item.price });
      }
    }

    // ── Create invoice ─────────────────────────────────────────────────────
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const client = data.clientName
      ? await db.client.findUnique({ where: { name: data.clientName } })
      : null;

    return db.$transaction(async (tx) => {
      const generatedInvoiceNumber =
        invoiceNumber || (await this.generateInvoiceNumber(tx));
      const invoice = await tx.invoice.create({
        data: {
          ...data,
          invoiceNumber: generatedInvoiceNumber,
          clientId: client?.id,
          amount: totalAmount,
          dueDate: new Date(dueDate),
          items: {
            create: items.map((item) => ({
              productId: item.productId || null,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      await Promise.all(
        stockUpdates.map(({ id, newStock }) =>
          tx.product.update({
            where: { id },
            data: { stock: newStock },
          })
        )
      );

      if (client) {
        await tx.client.update({
          where: { id: client.id },
          data: {
            outstandingAmount: {
              increment: totalAmount,
            },
          },
        });

        await Promise.all(
          pricedProducts.map((item) =>
            tx.productPriceHistory.create({
              data: {
                clientId: client.id,
                clientName: client.name,
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                date: new Date(),
                source: 'BILLING',
              },
            })
          )
        );
      }

      return invoice;
    });
  }

  async getStats() {
    const db = this.prisma as any;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRes, netSalesRes, totalInvoices] = await Promise.all([
      db.invoice.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: today } },
      }),
      db.invoice.aggregate({
        _sum: { amount: true },
      }),
      db.invoice.count(),
    ]);

    return {
      todaysBilling: todayRes?._sum?.amount || 0,
      netSales: netSalesRes?._sum?.amount || 0,
      totalInvoices: totalInvoices || 0,
    };
  }

  async remove(id: number) {
    const db = this.prisma as any;
    return db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      const deletedInvoice = await tx.invoice.delete({ where: { id } });

      if (invoice?.clientId) {
        await tx.client.update({
          where: { id: invoice.clientId },
          data: {
            outstandingAmount: {
              decrement: invoice.amount,
            },
          },
        });
      }

      return deletedInvoice;
    });
  }
}
