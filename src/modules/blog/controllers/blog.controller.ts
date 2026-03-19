import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BlogService } from '../services/blog.service';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';
import { BlogQueryDto } from '../dto/blog-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  private resolveUserIdFromRequest(req: any): string {
    const userId = req?.user?.userId ?? req?.user?._id ?? req?.user?.id ?? req?.user?.sub;

    if (!userId) {
      throw new BadRequestException('Cannot resolve user id from token');
    }

    return String(userId);
  }

  // ─── PUBLIC ────────────────────────────────────────

  @Get('posts')
  async getPublicPosts(@Query() query: BlogQueryDto) {
    return this.blogService.getPublicPosts(query);
  }

  @Get('categories')
  async getPublicCategories() {
    return this.blogService.getPublicCategories();
  }

  @Get('posts/:slug')
  async getPublicPostDetailBySlug(@Param('slug') slug: string) {
    return this.blogService.getPublicPostDetailBySlug(slug);
  }

  @Get('posts/:id/related')
  async getPublicRelatedPosts(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.blogService.getPublicRelatedPosts(id, limit ? Number(limit) : 4);
  }

  // ─── ADMIN / AUTHENTICATED ─────────────────────────

  @Get('admin/posts')
  @UseGuards(JwtAuthGuard)
  async getAdminPosts(@Query() query: BlogQueryDto) {
    return this.blogService.getAdminPosts(query);
  }

  @Get('admin/posts/:id')
  @UseGuards(JwtAuthGuard)
  async getAdminPostDetail(@Param('id') id: string) {
    return this.blogService.getAdminPostDetail(id);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createAdminPost(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req: any) {
    return this.blogService.createAdminPost(createBlogPostDto, this.resolveUserIdFromRequest(req));
  }

  @Put('posts/:slug')
  @UseGuards(JwtAuthGuard)
  async updateAdminPost(
    @Param('slug') slug: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto,
  ) {
    return this.blogService.updateAdminPost(slug, updateBlogPostDto);
  }

  @Delete('posts/:slug')
  @UseGuards(JwtAuthGuard)
  async deleteAdminPost(@Param('slug') slug: string) {
    return this.blogService.deleteAdminPost(slug);
  }
}
