import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogComment } from '../schemas/blog-comment.schema';
import { BlogPost } from '../schemas/blog-post.schema';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { BlogCommentQueryDto } from '../dto/blog-comment-query.dto';
import { PaginatedResponse } from '../../../shared/responses/paginated.response';

@Injectable()
export class BlogCommentsService {
  constructor(
    @InjectModel(BlogComment.name) private commentModel: Model<BlogComment>,
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPost>,
  ) {}

  async create(postId: string, createCommentDto: CreateCommentDto) {
    const post = await this.blogPostModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const commentData: Record<string, unknown> = {
      post: new Types.ObjectId(postId),
      authorName: createCommentDto.authorName,
      authorEmail: createCommentDto.authorEmail,
      content: createCommentDto.content,
      status: this.determineCommentStatus(createCommentDto),
    };

    if (createCommentDto.parentId) {
      commentData.parent = new Types.ObjectId(createCommentDto.parentId);
    }

    const comment = await this.commentModel.create(commentData);

    // Cập nhật comment count trong post
    await this.blogPostModel.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } }
    );

    return comment;
  }

  async findByPost(postId: string, page: number = 1, limit: number = 20) {
    const comments = await this.commentModel
      .find({ 
        post: new Types.ObjectId(postId),
        status: 'approved',
        parent: null // Chỉ lấy comment gốc
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'replies',
        match: { status: 'approved' },
        options: { sort: { createdAt: 1 } }
      })
      .exec();

    const total = await this.commentModel.countDocuments({
      post: new Types.ObjectId(postId),
      status: 'approved',
      parent: null
    });

    return { comments, total };
  }

  async getAdminComments(query: BlogCommentQueryDto) {
    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.postId) {
      filter.post = new Types.ObjectId(query.postId);
    }

    if (query.userId) {
      filter.user = new Types.ObjectId(query.userId);
    }

    if (query.search) {
      const regex = { $regex: query.search, $options: 'i' };
      filter.$or = [
        { content: regex },
        { authorName: regex },
        { authorEmail: regex },
      ];
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sortBy === 'oldest') {
      sort = { createdAt: 1 };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = await this.commentModel.countDocuments(filter);

    const comments = await this.commentModel
      .find(filter)
      .select({
        post: 1,
        user: 1,
        authorName: 1,
        authorEmail: 1,
        content: 1,
        status: 1,
        parent: 1,
        createdAt: 1,
      })
      .populate('post', 'title slug')
      .populate('user', 'firstName lastName avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return new PaginatedResponse(comments, { page, limit, total }, 'Successfully retrieved comments');
  }

  async updateStatus(commentId: string, status: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const oldStatus = comment.status;
    const updated = await this.commentModel.findByIdAndUpdate(
      commentId,
      { status },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Nếu status thay đổi từ pending sang approved hoặc ngược lại
    if (
      (oldStatus === 'pending' && status === 'approved') ||
      (oldStatus === 'approved' && status === 'pending')
    ) {
      const increment = status === 'approved' ? 1 : -1;
      await this.blogPostModel.findByIdAndUpdate(comment.post, {
        $inc: { commentCount: increment },
      });
    }

    return updated;
  }

  async delete(commentId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Giảm comment count nếu comment đã được approved
    if (comment.status === 'approved') {
      await this.blogPostModel.findByIdAndUpdate(
        comment.post,
        { $inc: { commentCount: -1 } }
      );
    }

    await this.commentModel.deleteOne({ _id: commentId });
    
    // Xóa các replies
    if (comment.replies?.length) {
      await this.commentModel.deleteMany({ parent: commentId });
    }
  }

  private determineCommentStatus(createCommentDto: CreateCommentDto): string {
    // Logic kiểm tra spam, có thể tích hợp Akismet hoặc tự viết rules
    const spamKeywords = ['spam', 'casino', 'gambling'];
    const content = createCommentDto.content.toLowerCase();
    
    if (spamKeywords.some(keyword => content.includes(keyword))) {
      return 'spam';
    }
    
    // Auto-approve cho comment đầu tiên của email
    // Hoặc có thể dựa vào reputation
    return 'pending'; // Mặc định pending, admin duyệt
  }
}