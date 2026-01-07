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

    const category = await this.categoryModel.create({
      name,
      description: dto.description?.trim(),
      isDeleted: false,
    });

    const categoryData = category.toObject();

    return new SuccessResponse(categoryData, 'Tạo danh mục thành công', 201);
  }

  async getCategoriesList(query: ListCategoriesDto) {
    const { q, sortBy = CategorySortBy.CREATED_AT, order = SortOrder.DESC, page = 1, limit = 10 } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // FILTER
    const filter: any = {
      isDeleted: { $ne: true },
    };

    // SEARCH
    if (q?.trim()) {
      const searchTerm = q.trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // SORT
    const sortMap: Record<string, any> = {
      [CategorySortBy.CREATED_AT]: { createdAt: order === SortOrder.ASC ? 1 : -1 },
      [CategorySortBy.UPDATED_AT]: { updatedAt: order === SortOrder.ASC ? 1 : -1 },
      [CategorySortBy.NAME]: { name: order === SortOrder.ASC ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .select({
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.categoryModel.countDocuments(filter),
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
