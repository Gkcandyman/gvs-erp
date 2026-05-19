import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReceivablesService } from './receivables.service';

@ApiTags('receivables')
@Controller('receivables')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Get('outstanding')
  @ApiOperation({ summary: 'Get read-only customer outstanding receivables' })
  findOutstanding() {
    return this.receivablesService.findOutstanding();
  }
}
