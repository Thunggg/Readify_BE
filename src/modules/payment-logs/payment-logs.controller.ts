import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentLogsService } from './payment-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { AccountRole } from '../staff/constants/staff.enum';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Payment Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payment-logs')
export class PaymentLogsController {
  constructor(private readonly paymentLogsService: PaymentLogsService) {}

  @Get('admin/all')
  @Roles(AccountRole.ADMIN)
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'orderCode', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAdminPaymentLogsList(
    @Query('userId') userId?: string,
    @Query('orderCode') orderCode?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentLogsService.getAdminPaymentLogsList({
      userId,
      orderCode,
      status,
      paymentMethod,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }
}
