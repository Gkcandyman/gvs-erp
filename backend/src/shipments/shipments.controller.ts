import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('shipments')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  findAll() {
    return this.shipmentsService.findAll();
  }
}
