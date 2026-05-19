import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.shipment.create({
      data,
    });
  }

  async updateStatus(id: number, status: any) {
    return this.prisma.shipment.update({
      where: { id },
      data: { status },
    });
  }
}
