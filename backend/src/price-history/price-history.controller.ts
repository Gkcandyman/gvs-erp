import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PriceHistoryService } from './price-history.service';

@UseGuards(JwtAuthGuard)
@Controller('price-history')
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Get()
  findAll(@Query('clientId') clientId?: string, @Query('productId') productId?: string) {
    return this.priceHistoryService.findAll(clientId, productId);
  }
}
