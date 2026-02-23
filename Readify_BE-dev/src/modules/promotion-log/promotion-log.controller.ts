/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Query, Req, UseGuards, Param } from '@nestjs/common';
import { PromotionLogService } from './promotion-log.service';
import { SearchPromotionLogDto } from './dto/search-promotion-log.dto';
import { PromotionLogIdDto } from './dto/promotion-log-id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promotion-logs')
@UseGuards(JwtAuthGuard)
export class PromotionLogController {
  constructor(private readonly promotionLogService: PromotionLogService) {}

  @Get()
  getList(@Query() query: SearchPromotionLogDto, @Req() req: any) {
    return this.promotionLogService.getPromotionLogs(query, req.user.userId);
  }

  @Get(':id')
  getDetail(@Param() params: PromotionLogIdDto, @Req() req: any) {
    return this.promotionLogService.getPromotionLogDetail(params.id, req.user.userId);
  }
}
