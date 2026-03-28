import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesDto, CategorySortBy, SortOrder } from './dto/list-categories.dto';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';

import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async createCategory(dto: CreateCategoryDto) {
    const name = dto.name.trim();

    // Check if name is empty after trim
    if (!name) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'name', message: 'Category name cannot be empty' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if category name already exists
    const existingCategory = await this.categoryModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive
      isDeleted: { $ne: true },
    });

    if (existingCategory) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'name', message: 'Category name already exists' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate slug
    const slug = slugify(name, {
      lower: true,
      locale: 'vi',
      strict: true,
    });

    const category = new this.categoryModel({
      name,
      slug,
      description: dto.description?.trim(),
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      isDeleted: false,
    });

    await category.save();
    const categoryData = category.toObject();

    return new SuccessResponse(categoryData, 'Tạo danh mục thành công', 201);
  }

  async getCategoriesList(query: ListCategoriesDto) {
    const { q, sortBy = CategorySortBy.CREATED_AT, order = SortOrder.DESC, page = 1, limit = 10 } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(250, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // BASE FILTER
    const match: any = {
      isDeleted: { $ne: true },
    };

    // SEARCH
    if (q?.trim()) {
      const searchTerm = q.trim();
      match.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // SORT
    const sortFieldMap: Record<string, string> = {
      [CategorySortBy.CREATED_AT]: 'createdAt',
      [CategorySortBy.UPDATED_AT]: 'updatedAt',
      [CategorySortBy.NAME]: 'name',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';
    const sortOrder: 1 | -1 = order === SortOrder.ASC ? 1 : -1;

    // AGGREGATION PIPELINE
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'categoryIds',
          as: 'books',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          parentId: 1,
          bookCount: { $size: '$books' },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { [sortField]: sortOrder, _id: 1 } },
      { $skip: skip },
      { $limit: validLimit },
    ];

    const [items, total] = await Promise.all([
      this.categoryModel.aggregate(pipeline).exec(),
      this.categoryModel.countDocuments(match),
    ]);

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách danh mục thành công',
    );
  }

  async getCategoryDetail(categoryId: string) {
    // Validate categoryId
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid category ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = await this.categoryModel
      .findOne({
        _id: new Types.ObjectId(categoryId),
        isDeleted: { $ne: true },
      })
      .select({
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!category) {
      throw new HttpException(ErrorResponse.notFound('Category not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(category, 'Lấy chi tiết danh mục thành công', 200);
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    // Validate categoryId
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid category ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(categoryId),
      isDeleted: { $ne: true },
    });

    if (!category) {
      throw new HttpException(ErrorResponse.notFound('Category not found'), HttpStatus.NOT_FOUND);
    }

    // Check if new name already exists (if name is being updated)
    if (dto.name !== undefined) {
      const newName = dto.name.trim();

      // Check if name is empty after trim
      if (!newName) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'name', message: 'Category name cannot be empty' }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingCategory = await this.categoryModel.findOne({
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
        _id: { $ne: category._id },
        isDeleted: { $ne: true },
      });

      if (existingCategory) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'name', message: 'Category name already exists' }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      category.name = newName;
    }

    if (dto.description !== undefined) {
      category.description = dto.description.trim();
    }
    
    if (dto.parentId !== undefined) {
      category.parentId = dto.parentId ? new Types.ObjectId(dto.parentId) : null;
    }

    const saved = await category.save();
    const categoryData = saved.toObject();

    return new SuccessResponse(categoryData, 'Cập nhật danh mục thành công', 200);
  }

  async deleteCategory(categoryId: string) {
    // Validate categoryId
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid category ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(categoryId),
      isDeleted: { $ne: true },
    });

    if (!category) {
      throw new HttpException(ErrorResponse.notFound('Category not found'), HttpStatus.NOT_FOUND);
    }

    // Soft delete
    category.isDeleted = true;
    await category.save();

    return new SuccessResponse({ _id: categoryId }, 'Xóa danh mục thành công', 200);
  }
}
