import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, BlogPostDocument } from '../schemas/blog-post.schema';
import { BlogCategory } from '../schemas/blog-category.schema';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';
import { BlogQueryDto } from '../dto/blog-query.dto';
import { SuccessResponse } from '../../../shared/responses/success.response';
import { PaginatedResponse } from '../../../shared/responses/paginated.response';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPostDocument>,
    @InjectModel(BlogCategory.name) private categoryModel: Model<BlogCategory>,
  ) {}

  /**
   * Lấy danh sách bài viết (public: chỉ published, admin: theo status)
   */
  async findAll(query: BlogQueryDto) {
    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = 'published';
    }

    if (query.category) {
      const category = await this.categoryModel.findOne({
        slug: query.category,
        deletedAt: null,
      });
      if (category) {
        filter.category = category._id;
      }
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    if (query.author) {
      filter.author = new Types.ObjectId(query.author);
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { excerpt: { $regex: query.search, $options: 'i' } },
      ];
    }

    let sort: Record<string, any> = {};
    switch (query.sortBy) {
      case 'popular':
        sort = { viewCount: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      case 'oldest':
        sort = { publishedAt: 1 };
        break;
      default:
        sort = { publishedAt: -1 };
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = await this.blogPostModel.countDocuments(filter);

    const posts = await this.blogPostModel
      .find(filter)
      .select({
        title: 1,
        slug: 1,
        excerpt: 1,
        featuredImage: 1,
        category: 1,
        author: 1,
        tags: 1,
        viewCount: 1,
        commentCount: 1,
        publishedAt: 1,
        createdAt: 1,
      })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return new PaginatedResponse(posts, { page, limit, total }, 'Lấy danh sách bài viết thành công');
  }

  /**
   * Lấy chi tiết bài viết theo slug (public)
   */
  async findBySlug(slug: string) {
    const post = await this.blogPostModel
      .findOne({ slug, deletedAt: null, status: 'published' })
      .populate('category', 'name slug description')
      .populate('author', 'firstName lastName avatarUrl')
      .populate('book', 'title slug thumbnailUrl')
      .lean();

    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    // Tăng view count (fire and forget)
    void this.blogPostModel.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } }).exec();

    return new SuccessResponse(post, 'Lấy chi tiết bài viết thành công');
  }

  /**
   * Lấy bài viết liên quan (cùng category hoặc cùng tags)
   */
  async getRelatedPosts(postId: string, limit: number = 4) {
    if (!Types.ObjectId.isValid(postId)) {
      return new SuccessResponse([], 'Không tìm thấy bài viết liên quan');
    }

    const post = await this.blogPostModel.findById(postId).lean();
    if (!post) {
      return new SuccessResponse([], 'Không tìm thấy bài viết liên quan');
    }

    const orConditions: any[] = [{ category: post.category }];
    if (post.tags?.length) {
      orConditions.push({ tags: { $in: post.tags } });
    }

    const relatedPosts = await this.blogPostModel
      .find({
        _id: { $ne: post._id },
        status: 'published',
        deletedAt: null,
        $or: orConditions,
      })
      .select({
        title: 1,
        slug: 1,
        excerpt: 1,
        featuredImage: 1,
        category: 1,
        author: 1,
        tags: 1,
        viewCount: 1,
        publishedAt: 1,
      })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName avatarUrl')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return new SuccessResponse(relatedPosts, 'Lấy bài viết liên quan thành công');
  }

  /**
   * Lấy tất cả blog categories (public)
   */
  async getCategories() {
    const categories = await this.categoryModel
      .find({ deletedAt: null })
      .select({ name: 1, slug: 1, description: 1, icon: 1, postCount: 1 })
      .sort({ name: 1 })
      .lean();

    return new SuccessResponse(categories, 'Lấy danh mục blog thành công');
  }

  /**
   * Tạo bài viết mới (Admin/Staff)
   */
  async create(createBlogPostDto: CreateBlogPostDto, authorId: string) {
    let slug = this.generateSlug(createBlogPostDto.title);

    const existing = await this.blogPostModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const postData: Record<string, unknown> = {
      ...createBlogPostDto,
      slug,
      author: new Types.ObjectId(authorId),
      publishedAt: createBlogPostDto.status === 'published' ? new Date() : null,
    };

    if (createBlogPostDto.bookId) {
      postData.book = new Types.ObjectId(createBlogPostDto.bookId);
      delete postData.bookId;
    }
    if (createBlogPostDto.categoryId) {
      postData.category = new Types.ObjectId(createBlogPostDto.categoryId);
      delete postData.categoryId;
    }

    const [createdPost] = await this.blogPostModel.create([postData]);

    if (createBlogPostDto.categoryId) {
      await this.categoryModel.findByIdAndUpdate(createBlogPostDto.categoryId, {
        $inc: { postCount: 1 },
      });
    }

    const populated = await this.blogPostModel
      .findById(createdPost._id)
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName avatarUrl')
      .lean();

    return new SuccessResponse(populated, 'Tạo bài viết thành công');
  }

  /**
   * Cập nhật bài viết
   */
  async update(slug: string, updateBlogPostDto: UpdateBlogPostDto) {
    const existingPost = await this.blogPostModel.findOne({ slug });
    if (!existingPost) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const updateData: Record<string, unknown> = { ...updateBlogPostDto };

    if (updateBlogPostDto.title && updateBlogPostDto.title !== existingPost.title) {
      let newSlug = this.generateSlug(updateBlogPostDto.title);
      const slugExists = await this.blogPostModel.findOne({
        slug: newSlug,
        _id: { $ne: existingPost._id },
      });
      if (slugExists) newSlug = `${newSlug}-${Date.now()}`;
      updateData.slug = newSlug;
    }

    if (
      updateBlogPostDto.categoryId &&
      updateBlogPostDto.categoryId !== existingPost.category.toString()
    ) {
      await this.categoryModel.findByIdAndUpdate(existingPost.category, { $inc: { postCount: -1 } });
      await this.categoryModel.findByIdAndUpdate(updateBlogPostDto.categoryId, { $inc: { postCount: 1 } });
      updateData.category = new Types.ObjectId(updateBlogPostDto.categoryId);
      delete updateData.categoryId;
    }

    if (existingPost.status === 'draft' && updateBlogPostDto.status === 'published') {
      updateData.publishedAt = new Date();
    }

    const updatedPost = await this.blogPostModel
      .findOneAndUpdate({ slug }, updateData, { new: true })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName avatarUrl')
      .lean();

    return new SuccessResponse(updatedPost, 'Cập nhật bài viết thành công');
  }

  /**
   * Xóa mềm bài viết
   */
  async delete(slug: string) {
    const post = await this.blogPostModel.findOne({ slug });
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    await this.blogPostModel.updateOne({ slug }, { deletedAt: new Date() });
    await this.categoryModel.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });

    return new SuccessResponse(null, 'Xóa bài viết thành công');
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
