import { BadRequestException, Controller, Get, Post, Body, Param, Query, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { BlogCommentsService } from '../services/blog-comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { BlogCommentQueryDto } from '../dto/blog-comment-query.dto';
import { ReplyCommentDto } from '../dto/reply-comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('blog/comments')
@ApiTags('Blog Comments')
export class BlogCommentsController {
  constructor(private readonly commentsService: BlogCommentsService) {}

  private resolveUserIdFromRequest(req: any): string {
    const userId = req?.user?.userId ?? req?.user?._id ?? req?.user?.id ?? req?.user?.sub;
    if (!userId) {
      throw new BadRequestException('Cannot resolve user id from token');
    }
    return String(userId);
  }

  @Get('post/:postId')
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.commentsService.findByPost(postId, page, limit);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async getAdminComments(@Query() query: BlogCommentQueryDto) {
    return this.commentsService.getAdminComments(query);
  }

  @Post('post/:postId')
  async create(@Param('postId') postId: string, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(postId, createCommentDto);
  }

  @Post('post/:postId/me')
  @UseGuards(JwtAuthGuard)
  async createAsUser(@Param('postId') postId: string, @Body() body: ReplyCommentDto, @Request() req: any): Promise<unknown> {
    const userId = this.resolveUserIdFromRequest(req);
    return (await this.commentsService.createAsUser(postId, userId, body.content)) as unknown;
  }

  @Post(':id/reply/me')
  @UseGuards(JwtAuthGuard)
  async replyAsUser(@Param('id') id: string, @Body() body: ReplyCommentDto, @Request() req: any): Promise<unknown> {
    const userId = this.resolveUserIdFromRequest(req);
    return (await this.commentsService.replyAsUser(id, userId, body.content)) as unknown;
  }

  @Put(':id/me')
  @UseGuards(JwtAuthGuard)
  async updateOwnComment(@Param('id') id: string, @Body() body: ReplyCommentDto, @Request() req: any): Promise<unknown> {
    const userId = this.resolveUserIdFromRequest(req);
    return (await this.commentsService.updateOwnComment(id, userId, body.content)) as unknown;
  }

  @Delete(':id/me')
  @UseGuards(JwtAuthGuard)
  async deleteOwnComment(@Param('id') id: string, @Request() req: any): Promise<unknown> {
    const userId = this.resolveUserIdFromRequest(req);
    return (await this.commentsService.deleteOwnComment(id, userId)) as unknown;
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.commentsService.updateStatus(id, body.status);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  async replyAsAdmin(@Param('id') id: string, @Body() body: ReplyCommentDto, @Request() req: any) {
    const userId = this.resolveUserIdFromRequest(req);
    const reply = await this.commentsService.replyAsAdmin(id, userId, body.content);
    return {
      success: true,
      message: 'Successfully replied to comment',
      data: reply,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.commentsService.delete(id);
  }
}
