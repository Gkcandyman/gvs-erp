import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true },
    });
  }

  async findByCategory(type: 'PACKAGING' | 'FOOD') {
    return this.prisma.product.findMany({
      where: {
        category: { type },
      },
      include: { category: true },
    });
  }

  async create(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data });
      
      if (product.stock > 0) {
        await tx.expense.create({
          data: {
            voucherNo: `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            category: 'PURCHASE',
            amount: product.stock * product.price,
            date: new Date(),
            remarks: `Initial purchase entry for ${product.name}`,
          }
        });
      }
      return product;
    });
  }

  async update(id: number, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const oldProduct = await tx.product.findUnique({ where: { id } });
      const newProduct = await tx.product.update({
        where: { id },
        data,
        include: { category: true },
      });

      if (oldProduct && newProduct.stock > oldProduct.stock) {
        const addedStock = newProduct.stock - oldProduct.stock;
        await tx.expense.create({
          data: {
            voucherNo: `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            category: 'PURCHASE',
            amount: addedStock * newProduct.price,
            date: new Date(),
            remarks: `Restocked ${addedStock} units of ${newProduct.name}`,
          }
        });
      }

      return newProduct;
    });
  }

  async updateStock(id: number, stock: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stock },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany();
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
