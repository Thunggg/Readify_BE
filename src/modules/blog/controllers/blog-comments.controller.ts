import { Controller, Get, Post, Body, Param, Query, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { BlogCommentsService } from '../services/blog-comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('blog/comments')
export class BlogCommentsController {
  constructor(private readonly commentsService: BlogCommentsService) {}

  @Get('post/:postId')
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.commentsService.findByPost(postId, page, limit);
  }

  @Post('post/:postId')
  async create(@Param('postId') postId: string, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(postId, createCommentDto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.commentsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.commentsService.delete(id);
  }
}
