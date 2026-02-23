import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
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
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) { }

  async createCategory(dto: CreateCategoryDto) {
    // ... (keep as is)
    const name = dto.name.trim();

    // Check if name is empty after trim
    if (!name) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'name', message: 'Category name cannot be empty' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if category name already exists.
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
      slug: slugify(name, { lower: true, strict: true, locale: 'vi' }),
      description: dto.description?.trim(),
      iconUrl: dto.iconUrl?.trim(),
      parentId: dto.parentId && Types.ObjectId.isValid(dto.parentId) ? new Types.ObjectId(dto.parentId) : undefined,
      status: dto.status ?? 1,
      isDeleted: false,
    });

    const categoryData = category.toObject();

    return new SuccessResponse(categoryData, 'Tạo danh mục thành công', 201);
  }

  async getCategoriesList(query: ListCategoriesDto) {
    const { q, status, sortBy = CategorySortBy.CREATED_AT, order = SortOrder.DESC, page = 1, limit = 10 } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // FILTER
    const filter: any = {
      isDeleted: { $ne: true },
    };

    // FILTER BY STATUS (if explicitly provided)
    if (status !== undefined && status !== null && status !== '') {
      const statusNum = typeof status === 'string' ? Number(status) : status;
      if (!isNaN(statusNum)) {
        filter.status = statusNum;
      }
    }

    // SEARCH
    if (q?.trim()) {
      const searchTerm = q.trim();
      filter.$or = [
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
    const sortOrder = order === SortOrder.ASC ? 1 : -1;

    // AGGREGATION PIPELINE
    const aggregationPipeline: any[] = [
      { $match: filter },
      // Join with books to count
      {
        $lookup: {
          from: 'books', // Adjust if collection name is different
          localField: '_id',
          foreignField: 'categoryIds',
          as: 'books',
        },
      },
      {
        $addFields: {
          bookCount: { $size: '$books' },
        },
      },
      {
        $project: {
          books: 0,
          isDeleted: 0,
          deletedAt: 0,
          __v: 0,
        },
      },
      { $sort: { [sortField]: sortOrder, _id: 1 } },
      { $skip: skip },
      { $limit: validLimit },
    ];

    const [items, total] = await Promise.all([
      this.categoryModel.aggregate(aggregationPipeline),
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
        slug: 1,
        description: 1,
        iconUrl: 1,
        parentId: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!category) {
      throw new HttpException(ErrorResponse.notFound('Category not found'), HttpStatus.NOT_FOUND);
    }

    // Get book count
    const bookCount = await this.bookModel.countDocuments({
      categoryIds: category._id,
      isDeleted: { $ne: true },
    });

    return new SuccessResponse({ ...category, bookCount }, 'Lấy chi tiết danh mục thành công', 200);
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
      category.slug = slugify(newName, { lower: true, strict: true, locale: 'vi' });
    }

    if (dto.description !== undefined) {
      category.description = dto.description.trim();
    }

    if (dto.iconUrl !== undefined) {
      category.iconUrl = dto.iconUrl.trim();
    }

    if (dto.parentId !== undefined) {
      category.parentId = dto.parentId && Types.ObjectId.isValid(dto.parentId) ? new Types.ObjectId(dto.parentId) : undefined;
    }

    if (dto.status !== undefined) {
      category.status = dto.status;
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
