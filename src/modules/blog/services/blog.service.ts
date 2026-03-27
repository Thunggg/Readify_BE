import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, BlogPostDocument } from '../schemas/blog-post.schema';
import { BlogCategory } from '../schemas/blog-category.schema';
import { BlogComment } from '../schemas/blog-comment.schema';
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
    @InjectModel(BlogComment.name) private commentModel: Model<BlogComment>,
  ) {}

  /**
   * Get list of articles (public: only published, admin: according to status)
   */
  async getPublicPosts(query: BlogQueryDto) {
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

    return new PaginatedResponse(posts, { page, limit, total }, 'Successfully retrieved list of articles');
  }

  /**
   * Get list of articles for admin (all statuses)
   */
  async getAdminPosts(query: BlogQueryDto) {
    const filter: Record<string, unknown> =
      query.isDeleted === true ? { deletedAt: { $ne: null } } : { deletedAt: null };

    if (query.status) {
      filter.status = query.status;
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
      const regex = { $regex: query.search, $options: 'i' };
      filter.$or = [{ title: regex }, { excerpt: regex }, { content: regex }];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {
        ...(query.startDate ? { $gte: query.startDate } : {}),
        ...(query.endDate ? { $lte: query.endDate } : {}),
      };
    }

    const sortBy = query.sortBy || 'newest';
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      popular: { viewCount: -1 },
      title: { title: 1 },
      oldest: { createdAt: 1 },
      publishedAt: { publishedAt: -1 },
      newest: { createdAt: -1 },
    };
    const sort = sortMap[sortBy] || sortMap.newest;

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
        status: 1,
        publishedAt: 1,
        createdAt: 1,
      })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return new PaginatedResponse(posts, { page, limit, total }, 'Successfully retrieved list of articles');
  }

  /**
   * Get article details by slug (public)
   */
  async getPublicPostDetailBySlug(slug: string) {
    const post = await this.blogPostModel
      .findOne({ slug, deletedAt: null, status: 'published' })
      .populate('category', 'name slug description')
      .populate('author', 'firstName lastName avatarUrl')
      .populate('book', 'title slug thumbnailUrl')
      .lean();

    if (!post) {
      throw new NotFoundException('Article does not exist');
    }

    // Tăng view count (fire and forget)
    void this.blogPostModel.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } }).exec();

    return new SuccessResponse(post, 'Successfully retrieved article details');
  }

  /**
   * Get article details for admin
   */
  async getAdminPostDetail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Article does not exist');
    }

    const post = await this.blogPostModel
      .findOne({ _id: id, deletedAt: null })
      .populate('category', 'name slug description')
      .populate('author', 'firstName lastName avatarUrl')
      .populate('book', 'title slug thumbnailUrl')
      .lean();

    if (!post) {
      throw new NotFoundException('Article does not exist');
    }

    return new SuccessResponse(post, 'Successfully retrieved article details');
  }

  /**
   * Get related articles (same category or same tags)
   */
  async getPublicRelatedPosts(postId: string, limit: number = 4) {
    if (!Types.ObjectId.isValid(postId)) {
      return new SuccessResponse([], 'No related articles found');
    }

    const post = await this.blogPostModel.findById(postId).lean();
    if (!post) {
      return new SuccessResponse([], 'No related articles found');
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

    return new SuccessResponse(relatedPosts, 'Successfully retrieved related articles');
  }

  /**
   * Get all blog categories (public)
   */
  async getPublicCategories() {
    const categories = await this.categoryModel
      .find({ deletedAt: null })
      .select({ name: 1, slug: 1, description: 1, icon: 1, postCount: 1 })
      .sort({ name: 1 })
      .lean();

    return new SuccessResponse(categories, 'Successfully retrieved blog categories');
  }

  /**
   * Create new article (Admin/Staff)
   */
  async createAdminPost(createBlogPostDto: CreateBlogPostDto, authorId: string) {
    if (!Types.ObjectId.isValid(authorId)) {
      throw new BadRequestException('Invalid author id');
    }

    if (createBlogPostDto.bookId && !Types.ObjectId.isValid(createBlogPostDto.bookId)) {
      throw new BadRequestException('Invalid book id');
    }

    if (!Types.ObjectId.isValid(createBlogPostDto.categoryId)) {
      throw new BadRequestException('Invalid category id');
    }

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

    if (createBlogPostDto.tags) {
      postData.tags = this.normalizeTags(createBlogPostDto.tags);
    }

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

    return new SuccessResponse(populated, 'Successfully created article');
  }

  /**
   * Update article
   */
  async updateAdminPost(slug: string, updateBlogPostDto: UpdateBlogPostDto) {
    const existingPost = await this.blogPostModel.findOne({ slug });
    if (!existingPost) {
      throw new NotFoundException('Article does not exist');
    }

    const previousStatus = existingPost.status;

    const updateData: Record<string, unknown> = { ...updateBlogPostDto };

    if (updateBlogPostDto.tags) {
      updateData.tags = this.normalizeTags(updateBlogPostDto.tags);
    }

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

    const nextStatus = updatedPost?.status;
    if (previousStatus !== nextStatus) {
      if (nextStatus === 'published') {
        await this.commentModel.updateMany({ post: existingPost._id }, { $set: { deletedAt: null } });
        const approvedCount = await this.commentModel.countDocuments({
          post: existingPost._id,
          status: 'approved',
          deletedAt: null,
        });
        await this.blogPostModel.updateOne({ _id: existingPost._id }, { $set: { commentCount: approvedCount } });
        if (updatedPost) {
          (updatedPost as any).commentCount = approvedCount;
        }
      } else {
        await this.commentModel.updateMany(
          { post: existingPost._id, deletedAt: null },
          { $set: { deletedAt: new Date() } },
        );
        await this.blogPostModel.updateOne({ _id: existingPost._id }, { $set: { commentCount: 0 } });
        if (updatedPost) {
          (updatedPost as any).commentCount = 0;
        }
      }
    }

    return new SuccessResponse(updatedPost, 'Successfully updated article');
  }

  /**
   * Soft delete article
   */
  async deleteAdminPost(slug: string) {
    const post = await this.blogPostModel.findOne({ slug });
    if (!post) {
      throw new NotFoundException('Article does not exist');
    }

    if (post.deletedAt) {
      throw new BadRequestException('Article has already been deleted');
    }

    await this.blogPostModel.updateOne({ slug }, { deletedAt: new Date() });
    await this.commentModel.updateMany({ post: post._id, deletedAt: null }, { $set: { deletedAt: new Date() } });
    await this.categoryModel.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
    await this.blogPostModel.updateOne({ _id: post._id }, { $set: { commentCount: 0 } });

    return new SuccessResponse(null, 'Successfully deleted article');
  }

  /**
   * Restore soft-deleted article
   */
  async restoreAdminPost(slug: string) {
    const post = await this.blogPostModel.findOne({ slug });
    if (!post) {
      throw new NotFoundException('Article does not exist');
    }

    if (!post.deletedAt) {
      throw new BadRequestException('Article is not deleted');
    }

    await this.blogPostModel.updateOne({ slug }, { deletedAt: null });
    await this.commentModel.updateMany({ post: post._id }, { $set: { deletedAt: null } });
    await this.categoryModel.findByIdAndUpdate(post.category, { $inc: { postCount: 1 } });

    const approvedCount = await this.commentModel.countDocuments({
      post: post._id,
      status: 'approved',
      deletedAt: null,
    });
    await this.blogPostModel.updateOne({ _id: post._id }, { $set: { commentCount: approvedCount } });

    return new SuccessResponse(null, 'Successfully restored article');
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

  private normalizeTags(tags: string[]): string[] {
    const normalizedTags = tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const uniqueTags: string[] = [];
    const seenTags = new Set<string>();

    for (const tag of normalizedTags) {
      const key = tag.toLowerCase();
      if (!seenTags.has(key)) {
        seenTags.add(key);
        uniqueTags.push(tag);
      }
    }

    return uniqueTags;
  }
}
