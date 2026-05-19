import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptsService } from './receipts.service';

@ApiTags('receipts')
@Controller('receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all collection receipts' })
  findAll() {
    return this.receiptsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get collection receipt statistics' })
  getStats() {
    return this.receiptsService.getStats();
  }

  @Post()
  @ApiOperation({ summary: 'Create a collection receipt' })
  create(@Body() createReceiptDto: CreateReceiptDto) {
    return this.receiptsService.create(createReceiptDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection receipt' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.remove(id);
  }
}
