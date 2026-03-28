import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogCategory } from '../schemas/blog-category.schema';
import { BlogPost, BlogPostDocument } from '../schemas/blog-post.schema';
import { CreateBlogCategoryDto } from '../dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from '../dto/update-blog-category.dto';
import { BlogCategoryQueryDto } from '../dto/blog-category-query.dto';
import { SuccessResponse } from '../../../shared/responses/success.response';
import { PaginatedResponse } from '../../../shared/responses/paginated.response';

@Injectable()
export class BlogCategoriesService {
  constructor(
    @InjectModel(BlogCategory.name) private categoryModel: Model<BlogCategory>,
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPostDocument>,
  ) {}

  async findAll(query: BlogCategoryQueryDto) {
    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = await this.categoryModel.countDocuments(filter);

    const categories = await this.categoryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return new PaginatedResponse(categories, { page, limit, total }, 'Successfully retrieved blog categories');
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Blog category not found');
    }

    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null }).lean();
    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    // Lấy bài viết thuộc danh mục
    const recentPosts = await this.blogPostModel
      .find({ category: id, deletedAt: null })
      .select({ title: 1, slug: 1, status: 1, publishedAt: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return new SuccessResponse({ ...category, recentPosts }, 'Successfully retrieved category details');
  }

  async create(dto: CreateBlogCategoryDto) {
    const existing = await this.categoryModel.findOne({ slug: dto.slug, deletedAt: null });
    if (existing) {
      throw new ConflictException('Slug for category already exists');
    }

    const newCategory = await this.categoryModel.create(dto);
    return new SuccessResponse(newCategory, 'Successfully created category');
  }

  async update(id: string, dto: UpdateBlogCategoryDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Blog category not found');
    }

    if (dto.slug) {
      const existing = await this.categoryModel.findOne({
        slug: dto.slug,
        _id: { $ne: id },
        deletedAt: null,
      });
      if (existing) {
        throw new ConflictException('Slug for category already exists');
      }
    }

    const updated = await this.categoryModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, dto, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Blog category not found');
    }

    return new SuccessResponse(updated, 'Successfully updated category');
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Blog category not found');
    }

    const category = await this.categoryModel.findOne({ _id: id, deletedAt: null });
    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    const postCount = await this.blogPostModel.countDocuments({ category: id, deletedAt: null });
    if (postCount > 0) {
      throw new ConflictException('Cannot delete category because it has active posts');
    }

    await this.categoryModel.updateOne({ _id: id }, { deletedAt: new Date() });

    return new SuccessResponse(null, 'Successfully deleted category');
  }
}
