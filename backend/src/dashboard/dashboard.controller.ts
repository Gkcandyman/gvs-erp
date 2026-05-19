import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard aggregate stats' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activities' })
  getActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Get('daily-metrics')
  @ApiOperation({ summary: 'Get daily sales, collections, and purchases' })
  getDailyMetrics() {
    return this.dashboardService.getDailyMetrics();
  }
}
