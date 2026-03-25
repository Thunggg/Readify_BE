import { Injectable } from '@nestjs/common';
import { IncomeStatisticsDto, TopSellingDto, RecentOrdersDto } from './dto/income-statistics.dto';
import { ViewIncomeService } from './services/view.income.service';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class IncomeService {
  constructor(private readonly viewIncomeService: ViewIncomeService) {}

  async getOverviewStats(userId: string): Promise<SuccessResponse<unknown>> {
    return this.viewIncomeService.getOverviewStats(userId);
  }

  async getIncomeStatistics(query: IncomeStatisticsDto, userId: string): Promise<SuccessResponse<unknown>> {
    return this.viewIncomeService.getIncomeStatistics(query, userId);
  }

  async getCategoryStatistics(query: IncomeStatisticsDto, userId: string): Promise<SuccessResponse<unknown>> {
    return this.viewIncomeService.getCategoryStatistics(query, userId);
  }

  async getTopSellingBooks(query: TopSellingDto, userId: string): Promise<SuccessResponse<unknown>> {
    return this.viewIncomeService.getTopSellingBooks(query, userId);
  }

  async getRecentOrders(query: RecentOrdersDto, userId: string): Promise<SuccessResponse<unknown>> {
    return this.viewIncomeService.getRecentOrders(query, userId);
  }
}
