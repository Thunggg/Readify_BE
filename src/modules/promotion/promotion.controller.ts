/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { SearchPromotionDto } from './dto/search-promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  getList(@Query() query: SearchPromotionDto, @Req() req: any) {
    return this.promotionService.getPromotionList(query, req.user.userId);
  }
}
