import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPostLike, BlogPostLikeDocument } from '../schemas/blog-post-like.schema';
import { BlogPost, BlogPostDocument } from '../schemas/blog-post.schema';
import { SuccessResponse } from '../../../shared/responses/success.response';

export type BlogPostLikeStatus = {
  liked: boolean;
  likesCount: number;
};

@Injectable()
export class BlogPostLikesService {
  constructor(
    @InjectModel(BlogPostLike.name) private readonly likeModel: Model<BlogPostLikeDocument>,
    @InjectModel(BlogPost.name) private readonly blogPostModel: Model<BlogPostDocument>,
  ) {}

  private async ensurePublishedPost(postId: string) {
    if (!Types.ObjectId.isValid(postId)) return null;

    return this.blogPostModel.findOne({
      _id: new Types.ObjectId(postId),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      status: 'published',
    });
  }

  async getLikeStatus(postId: string, userId: string) {
    const post = await this.ensurePublishedPost(postId);
    if (!post) throw new NotFoundException('Blog post not found');

    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const [likesCount, liked] = await Promise.all([
      this.likeModel.countDocuments({ blogPost: postObjectId }),
      this.likeModel.exists({ blogPost: postObjectId, user: userObjectId }),
    ]);

    return new SuccessResponse(
      { liked: Boolean(liked), likesCount },
      'Successfully retrieved like status',
    );
  }

  async likePost(postId: string, userId: string) {
    const post = await this.ensurePublishedPost(postId);
    if (!post) throw new NotFoundException('Blog post not found');

    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const existing = await this.likeModel.findOne({ blogPost: postObjectId, user: userObjectId }).lean();
    if (existing) {
      // Idempotent: already liked -> return current status
      return this.getLikeStatus(postId, userId);
    }

    try {
      await this.likeModel.create({ blogPost: postObjectId, user: userObjectId });
    } catch (err: any) {
      // In case of race condition around the unique index.
      if (err?.code === 11000) {
        return this.getLikeStatus(postId, userId);
      }
      throw err;
    }

    return this.getLikeStatus(postId, userId);
  }

  async unlikePost(postId: string, userId: string) {
    const post = await this.ensurePublishedPost(postId);
    if (!post) throw new NotFoundException('Blog post not found');

    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);

    const deleted = await this.likeModel.deleteOne({ blogPost: postObjectId, user: userObjectId });
    if (deleted.deletedCount === 0) {
      // Idempotent: nothing to delete -> return status anyway
      return this.getLikeStatus(postId, userId);
    }

    return this.getLikeStatus(postId, userId);
  }
}

