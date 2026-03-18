/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { IncomeService } from './income.service';
import {
  IncomeStatisticsDto,
  TopSellingDto,
  RecentOrdersDto,
  ExportIncomeDto,
} from './dto/income-statistics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AccountRole } from '../staff/constants/staff.enum';

@Controller('income')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN, AccountRole.SELLER)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get('overview')
  getOverview(@Req() req: any) {
    return this.incomeService.getOverviewStats(req.user.userId);
  }

  @Get('statistics')
  getStatistics(@Query() query: IncomeStatisticsDto, @Req() req: any) {
    return this.incomeService.getIncomeStatistics(query, req.user.userId);
  }

  @Get('categories')
  getCategoryStats(@Query() query: IncomeStatisticsDto, @Req() req: any) {
    return this.incomeService.getCategoryStatistics(query, req.user.userId);
  }

  @Get('top-selling')
  getTopSelling(@Query() query: TopSellingDto, @Req() req: any) {
    return this.incomeService.getTopSellingBooks(query, req.user.userId);
  }

  @Get('recent-orders')
  getRecentOrders(@Query() query: RecentOrdersDto, @Req() req: any) {
    return this.incomeService.getRecentOrders(query, req.user.userId);
  }

  @Get('export')
  exportIncome(@Query() query: ExportIncomeDto, @Req() req: any) {
    return this.incomeService.exportIncome(query, req.user.userId);
  }
}
