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
    return this.prisma.product.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
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
