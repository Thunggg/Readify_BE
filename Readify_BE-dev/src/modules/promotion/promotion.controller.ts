/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Post, Put, Delete, Query, Req, UseGuards, Param, Body } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { SearchPromotionDto } from './dto/search-promotion.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';
import { PromotionIdDto } from './dto/promotion-id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  getList(@Query() query: SearchPromotionDto, @Req() req: any) {
    return this.promotionService.getPromotionList(query, req.user.userId);
  }

  @Get(':id')
  getDetail(@Param() params: PromotionIdDto, @Req() req: any) {
    return this.promotionService.getPromotionDetail(params.id, req.user.userId);
  }

  @Post()
  create(@Body() createDto: CreatePromotionDto, @Req() req: any) {
    return this.promotionService.createPromotion(createDto, req.user.userId);
  }

  @Put(':id')
  update(@Param() params: PromotionIdDto, @Body() updateDto: UpdatePromotionDto, @Req() req: any) {
    return this.promotionService.updatePromotion(params.id, updateDto, req.user.userId);
  }

  @Delete(':id')
  delete(@Param() params: PromotionIdDto, @Req() req: any) {
    return this.promotionService.deletePromotion(params.id, req.user.userId);
  }

  @Post('apply')
  applyPromotion(@Body() applyDto: ApplyPromotionDto, @Req() req: any) {
    return this.promotionService.applyPromotion(applyDto, req.user.userId);
  }
}
