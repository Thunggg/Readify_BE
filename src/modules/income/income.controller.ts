import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeStatisticsDto, TopSellingDto, RecentOrdersDto } from './dto/income-statistics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AccountRole } from '../staff/constants/staff.enum';
import { SuccessResponse } from '../../shared/responses/success.response';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('income')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN, AccountRole.SELLER)
@ApiTags('Income')
@ApiBearerAuth()
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Get('overview')
  async getOverview(@Req() req: AuthenticatedRequest): Promise<SuccessResponse<unknown>> {
    const response = await this.incomeService.getOverviewStats(req.user.userId);
    return response as SuccessResponse<unknown>;
  }

  @Get('statistics')
  async getStatistics(
    @Query() query: IncomeStatisticsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const response = await this.incomeService.getIncomeStatistics(query, req.user.userId);
    return response as SuccessResponse<unknown>;
  }

  @Get('categories')
  async getCategoryStats(
    @Query() query: IncomeStatisticsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const response = await this.incomeService.getCategoryStatistics(query, req.user.userId);
    return response as SuccessResponse<unknown>;
  }

  @Get('top-selling')
  async getTopSelling(
    @Query() query: TopSellingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const response = await this.incomeService.getTopSellingBooks(query, req.user.userId);
    return response as SuccessResponse<unknown>;
  }

  @Get('recent-orders')
  async getRecentOrders(
    @Query() query: RecentOrdersDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const response = await this.incomeService.getRecentOrders(query, req.user.userId);
    return response as SuccessResponse<unknown>;
  }
}
