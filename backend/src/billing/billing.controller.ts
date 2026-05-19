import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {
    console.log('BillingController initialized');
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  findAll() {
    return this.billingService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get billing statistics' })
  getStats() {
    return this.billingService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOne(id);
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping billing module' })
  ping() {
    return { status: 'Billing module is active' };
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    console.log('Creating invoice:', createInvoiceDto);
    return this.billingService.create(createInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.remove(id);
  }
}
