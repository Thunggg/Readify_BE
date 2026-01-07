import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';
import { ReviewIdDto } from './dto/review-id.dto';
import { BookIdDto } from './dto/book-id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AccountRole } from '../staff/constants/staff.enum';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(@Body() dto: CreateReviewDto, @Req() req: any) {
    return this.reviewsService.createReview(dto, req?.user?.userId);
  }

  @Get()
  getReviewsList(@Query() query: ListReviewsDto, @Req() req: any) {
    return this.reviewsService.getReviewsList(query, req?.user?.userId, req?.user?.role);
  }

  // Admin endpoints - Must be before :id routes to avoid route conflicts
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.ADMIN)
  getAdminReviewsList(@Query() query: ListReviewsDto, @Req() req: any) {
    return this.reviewsService.getReviewsList(query, req?.user?.userId, req?.user?.role);
  }

  @Get('book/:bookId')
  getBookReviews(@Param() params: BookIdDto, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.reviewsService.getBookReviews(params.bookId, page, limit);
  }

  @Get('book/:bookId/summary')
  getBookRatingSummary(@Param() params: BookIdDto) {
    return this.reviewsService.getBookRatingSummary(params.bookId);
  }

  @Get(':id')
  getReviewDetail(@Param() params: ReviewIdDto, @Req() req: any) {
    return this.reviewsService.getReviewDetail(params.id, req?.user?.userId, req?.user?.role);
  }

  @Patch(':id/helpful')
  @UseGuards(JwtAuthGuard)
  markHelpful(@Param() params: ReviewIdDto, @Req() req: any) {
    return this.reviewsService.markHelpful(params.id, req?.user?.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateReview(
    @Param() params: ReviewIdDto,
    @Body() dto: UpdateReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.updateReview(params.id, dto, req?.user?.userId, req?.user?.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteReview(@Param() params: ReviewIdDto, @Req() req: any) {
    return this.reviewsService.deleteReview(params.id, req?.user?.userId, req?.user?.role);
  }
}

