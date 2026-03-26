import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BlogCategoriesService } from '../services/blog-categories.service';
import { CreateBlogCategoryDto } from '../dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from '../dto/update-blog-category.dto';
import { BlogCategoryQueryDto } from '../dto/blog-category-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('admin/blog-categories')
@ApiTags('Admin Blog Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BlogCategoriesController {
  constructor(private readonly categoriesService: BlogCategoriesService) {}

  @Get()
  findAll(@Query() query: BlogCategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
