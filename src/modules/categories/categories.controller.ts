import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { CategoryIdDto } from './dto/category-id.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Get()
  getCategoriesList(@Query() query: ListCategoriesDto) {
    return this.categoriesService.getCategoriesList(query);
  }

  @Get(':id')
  getCategoryDetail(@Param() params: CategoryIdDto) {
    return this.categoriesService.getCategoryDetail(params.id);
  }

  @Patch(':id')
  updateCategory(@Param() params: CategoryIdDto, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(params.id, dto);
  }

  @Delete(':id')
  deleteCategory(@Param() params: CategoryIdDto) {
    return this.categoriesService.deleteCategory(params.id);
  }
}

