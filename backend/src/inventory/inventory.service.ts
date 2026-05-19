import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async generateSku() {
    const latestProduct = await this.prisma.product.findFirst({
      where: { sku: { startsWith: 'GVS-' } },
      orderBy: { id: 'desc' },
    });
    const latestNumber = Number(latestProduct?.sku?.replace('GVS-', '')) || 0;

    return `GVS-${String(latestNumber + 1).padStart(5, '0')}`;
  }

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
    const { sku: _sku, ...productData } = data;
    const sku = await this.generateSku();

    return this.prisma.product.create({
      data: {
        ...productData,
        sku,
      },
    });
  }

  async update(id: number, data: any) {
    const { sku, ...updateData } = data;
    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
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
