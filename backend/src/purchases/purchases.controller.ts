import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PurchasesService } from './purchases.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  findAll(@Req() req: any) {
    const canViewPurchases = req.user?.role === Role.ADMIN || req.user?.permissions?.purchase?.view === true;
    if (!canViewPurchases) {
      throw new ForbiddenException('You do not have access to view purchases');
    }

    return this.purchasesService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() data: any) {
    return this.purchasesService.create(data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.remove(id);
  }
}
