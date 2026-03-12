import {
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

  // ─── PUBLIC ────────────────────────────────────────

  @Get('posts')
  async findAll(@Query() query: BlogQueryDto) {
    return this.blogService.findAll(query);
  }

  @Get('categories')
  async getCategories() {
    return this.blogService.getCategories();
  }

  @Get('posts/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Get('posts/:id/related')
  async getRelatedPosts(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.blogService.getRelatedPosts(id, limit ? Number(limit) : 4);
  }

  // ─── AUTHENTICATED ─────────────────────────────────

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req: any) {
    return this.blogService.create(createBlogPostDto, String(req.user._id));
  }

  @Put('posts/:slug')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('slug') slug: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto,
  ) {
    return this.blogService.update(slug, updateBlogPostDto);
  }

  @Delete('posts/:slug')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('slug') slug: string) {
    return this.blogService.delete(slug);
  }
}
