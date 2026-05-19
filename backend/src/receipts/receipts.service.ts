import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const db = this.prisma as any;
    return db.receipt.findMany({
      include: { client: true },
      orderBy: { date: 'desc' },
    });
  }

  private async generateReceiptNo(db: any) {
    const latestReceipt = await db.receipt.findFirst({
      where: { receiptNo: { startsWith: 'R-' } },
      orderBy: { id: 'desc' },
    });
    
    const latestNumber = latestReceipt 
      ? parseInt(latestReceipt.receiptNo.replace('R-', '')) 
      : 0;

    return `R-${String(latestNumber + 1).padStart(3, '0')}`;
  }

  async create(createReceiptDto: CreateReceiptDto) {
    const db = this.prisma as any;
    const { date, paymentMode, receiptNo: _receiptNo, ...data } = createReceiptDto;

    return db.$transaction(async (tx) => {
      const generatedReceiptNo = await this.generateReceiptNo(tx);
      const receipt = await tx.receipt.create({
        data: {
          ...data,
          receiptNo: generatedReceiptNo,
          date: date ? new Date(date) : new Date(),
          paymentMode: paymentMode || 'CASH',
        },
        include: { client: true },
      });

      await tx.client.update({
        where: { id: data.clientId },
        data: {
          outstandingAmount: {
            decrement: data.amount,
          },
        },
      });

      return receipt;
    });
  }

  async getStats() {
    const db = this.prisma as any;
    const [totalCollections, receiptCount] = await Promise.all([
      db.receipt.aggregate({ _sum: { amount: true } }),
      db.receipt.count(),
    ]);

    return {
      totalCollections: totalCollections?._sum?.amount || 0,
      receiptCount,
    };
  }

  async remove(id: number) {
    const db = this.prisma as any;

    return db.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({ where: { id } });
      const deletedReceipt = await tx.receipt.delete({ where: { id } });

      if (receipt) {
        await tx.client.update({
          where: { id: receipt.clientId },
          data: {
            outstandingAmount: {
              increment: receipt.amount,
            },
          },
        });
      }

      return deletedReceipt;
    });
  }
}
