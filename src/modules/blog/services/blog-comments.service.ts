import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogComment } from '../schemas/blog-comment.schema';
import { BlogPost } from '../schemas/blog-post.schema';
import { Account } from '../../accounts/schemas/account.schema';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { BlogCommentQueryDto } from '../dto/blog-comment-query.dto';
import { PaginatedResponse } from '../../../shared/responses/paginated.response';
import { SuccessResponse } from '../../../shared/responses/success.response';

@Injectable()
export class BlogCommentsService {
  private static readonly USER_EDIT_WINDOW_MS = 15 * 60 * 1000;
  private static readonly USER_MIN_INTERVAL_MS = 8 * 1000;
  private static readonly USER_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
  private static readonly MAX_REPLY_DEPTH = 2;

  constructor(
    @InjectModel(BlogComment.name) private commentModel: Model<BlogComment>,
    @InjectModel(BlogPost.name) private blogPostModel: Model<BlogPost>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  async create(postId: string, createCommentDto: CreateCommentDto) {
    const post = await this.blogPostModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    if (post.deletedAt || post.status !== 'published') {
      throw new NotFoundException('Bài viết không cho phép bình luận');
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
    const post = await this.blogPostModel.findById(postId).lean();
    if (!post || post.deletedAt || post.status !== 'published') {
      return new SuccessResponse({ comments: [], total: 0 }, 'Successfully retrieved comments');
    }

    const comments = await this.commentModel
      .find({ 
        post: new Types.ObjectId(postId),
        status: { $in: ['approved', 'deleted'] },
        deletedAt: null,
        parent: null // Chỉ lấy comment gốc
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'firstName lastName avatarUrl')
      .populate({
        path: 'replies',
        match: { status: { $in: ['approved', 'deleted'] }, deletedAt: null },
        options: { sort: { createdAt: 1 } },
        populate: [
          { path: 'user', select: 'firstName lastName avatarUrl' },
          {
            path: 'replies',
            match: { status: { $in: ['approved', 'deleted'] }, deletedAt: null },
            options: { sort: { createdAt: 1 } },
            populate: { path: 'user', select: 'firstName lastName avatarUrl' },
          },
        ],
      })
      .exec();

    const total = await this.commentModel.countDocuments({
      post: new Types.ObjectId(postId),
      status: { $in: ['approved', 'deleted'] },
      deletedAt: null,
    });

    return new SuccessResponse({ comments, total }, 'Successfully retrieved comments');
  }

  async createAsUser(postId: string, userId: string, content: string): Promise<SuccessResponse<BlogComment | null>> {
    const identity = await this.getAccountIdentity(userId);
    if (!identity) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const post = await this.assertPostCanComment(postId);
    const normalizedContent = this.normalizeContent(content);

    await this.enforceAntiSpam({
      postId,
      authorEmail: identity.email,
      content: normalizedContent,
      parentId: null,
    });

    const created = await this.commentModel.create({
      post: post._id,
      user: identity.id,
      authorName: identity.name,
      authorEmail: identity.email,
      content: normalizedContent,
      status: 'approved',
    });

    await this.blogPostModel.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });

    const saved = await this.commentModel.findById(created._id).populate('user', 'firstName lastName avatarUrl').lean();
    return new SuccessResponse(saved, 'Successfully created comment');
  }

  async replyAsUser(parentCommentId: string, userId: string, content: string): Promise<SuccessResponse<BlogComment | null>> {
    const identity = await this.getAccountIdentity(userId);
    if (!identity) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const parent = await this.commentModel.findById(parentCommentId);
    if (!parent) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const post = await this.assertPostCanComment(String(parent.post));
    await this.assertReplyDepth(parent);

    const normalizedContent = this.normalizeContent(content);

    await this.enforceAntiSpam({
      postId: String(post._id),
      authorEmail: identity.email,
      content: normalizedContent,
      parentId: String(parent._id),
    });

    const created = await this.commentModel.create({
      post: post._id,
      user: identity.id,
      parent: parent._id,
      authorName: identity.name,
      authorEmail: identity.email,
      content: normalizedContent,
      status: 'approved',
    });

    await this.commentModel.updateOne({ _id: parent._id }, { $addToSet: { replies: created._id } });
    await this.blogPostModel.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });

    const saved = await this.commentModel.findById(created._id).populate('user', 'firstName lastName avatarUrl').lean();
    return new SuccessResponse(saved, 'Successfully created reply');
  }

  async updateOwnComment(commentId: string, userId: string, content: string): Promise<SuccessResponse<BlogComment | null>> {
    const identity = await this.getAccountIdentity(userId);
    if (!identity) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    this.assertOwner(comment, identity.id, identity.email);

    if (comment.status === 'deleted') {
      throw new BadRequestException('Không thể chỉnh sửa bình luận đã xoá');
    }

    const createdAt = comment.createdAt ? new Date(comment.createdAt).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > BlogCommentsService.USER_EDIT_WINDOW_MS) {
      throw new ForbiddenException('Chỉ được chỉnh sửa bình luận trong vòng 15 phút');
    }

    const normalizedContent = this.normalizeContent(content);
    if (normalizedContent === this.normalizeContent(comment.content || '')) {
      throw new BadRequestException('Nội dung bình luận không thay đổi');
    }

    comment.content = normalizedContent;
    await comment.save();

    const saved = await this.commentModel.findById(comment._id).populate('user', 'firstName lastName avatarUrl').lean();
    return new SuccessResponse(saved, 'Successfully updated comment');
  }

  async deleteOwnComment(commentId: string, userId: string): Promise<SuccessResponse<null>> {
    const identity = await this.getAccountIdentity(userId);
    if (!identity) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    this.assertOwner(comment, identity.id, identity.email);

    if (comment.status === 'deleted') {
      return new SuccessResponse(null, 'Comment already deleted');
    }

    const shouldDecrement = comment.status === 'approved';

    comment.status = 'deleted';
    // Keep required field valid while UI still renders placeholder by status.
    comment.content = 'Comment đã bị xoá';
    await comment.save();

    if (shouldDecrement) {
      const post = await this.blogPostModel.findById(comment.post).select({ status: 1, deletedAt: 1 }).lean();
      if (post && !post.deletedAt && post.status === 'published') {
        await this.blogPostModel.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
      }
    }

    return new SuccessResponse(null, 'Successfully deleted comment');
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
      const post = await this.blogPostModel.findById(comment.post).select({ status: 1, deletedAt: 1 }).lean();
      if (post && !post.deletedAt && post.status === 'published') {
        const increment = status === 'approved' ? 1 : -1;
        await this.blogPostModel.findByIdAndUpdate(comment.post, {
          $inc: { commentCount: increment },
        });
      }
    }

    return new SuccessResponse(updated, 'Successfully updated comment status');
  }

  async replyAsAdmin(parentCommentId: string, userId: string, content: string): Promise<BlogComment | null> {
    const parent = await this.commentModel.findById(parentCommentId).lean();
    if (!parent) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    let authorName = 'Admin';
    let authorEmail = 'admin@readify.local';
    let accountObjectId: Types.ObjectId | undefined;

    if (Types.ObjectId.isValid(userId)) {
      accountObjectId = new Types.ObjectId(userId);
      const account = await this.accountModel
        .findById(accountObjectId)
        .select({ firstName: 1, lastName: 1, email: 1 })
        .lean();

      if (account) {
        const fullName = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
        authorName = fullName || account.email || 'Admin';
        authorEmail = account.email || authorEmail;
      }
    }

    const created = await this.commentModel.create({
      post: parent.post,
      user: accountObjectId,
      parent: parent._id,
      authorName,
      authorEmail,
      content: content.trim(),
      status: 'approved',
    });

    await this.commentModel.updateOne({ _id: parent._id }, { $addToSet: { replies: created._id } });
    await this.blogPostModel.findByIdAndUpdate(parent.post, { $inc: { commentCount: 1 } });

    const reply = await this.commentModel.findById(created._id).lean<BlogComment>();
    return reply;
  }

  async delete(commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    // Collect all descendants (multi-level replies) so delete works correctly for nested reply trees.
    const idsToDelete: Types.ObjectId[] = [comment._id as Types.ObjectId];
    let frontier: Types.ObjectId[] = [comment._id as Types.ObjectId];

    while (frontier.length > 0) {
      const children = await this.commentModel
        .find({ parent: { $in: frontier } })
        .select({ _id: 1 })
        .lean();

      const childIds = children
        .map((child) => child._id)
        .filter((id): id is Types.ObjectId => Boolean(id));

      if (childIds.length === 0) {
        break;
      }

      idsToDelete.push(...childIds);
      frontier = childIds;
    }

    const approvedCount = await this.commentModel.countDocuments({
      _id: { $in: idsToDelete },
      status: 'approved',
    });

    await this.commentModel.deleteMany({ _id: { $in: idsToDelete } });

    if (approvedCount > 0) {
      const post = await this.blogPostModel.findById(comment.post).select({ status: 1, deletedAt: 1 }).lean();
      if (!post || post.deletedAt || post.status !== 'published') {
        return new SuccessResponse(null, 'Successfully deleted comment');
      }

      await this.blogPostModel.findByIdAndUpdate(comment.post, {
        $inc: { commentCount: -approvedCount },
      });
    }

    return new SuccessResponse(null, 'Successfully deleted comment');
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

  private normalizeContent(content: string): string {
    const normalized = (content || '').trim().replace(/\s+/g, ' ');
    if (!normalized || normalized.length < 1) {
      throw new BadRequestException('Nội dung bình luận không hợp lệ');
    }
    return normalized;
  }

  private async assertPostCanComment(postId: string) {
    const post = await this.blogPostModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }
    if (post.deletedAt || post.status !== 'published') {
      throw new NotFoundException('Bài viết không cho phép bình luận');
    }
    return post;
  }

  private async assertReplyDepth(parent: BlogComment) {
    let depth = 0;
    let currentParentId = parent.parent ? String(parent.parent) : null;

    while (currentParentId) {
      depth += 1;
      const ancestor = await this.commentModel.findById(currentParentId).select({ parent: 1 }).lean();
      if (!ancestor) {
        break;
      }
      currentParentId = ancestor.parent ? String(ancestor.parent) : null;
    }

    const replyDepth = depth + 1;
    if (replyDepth > BlogCommentsService.MAX_REPLY_DEPTH) {
      throw new BadRequestException('Bình luận chỉ hỗ trợ tối đa 2 cấp trả lời');
    }
  }

  private async enforceAntiSpam(input: {
    postId: string;
    authorEmail: string;
    content: string;
    parentId: string | null;
  }) {
    const now = Date.now();

    const recent = await this.commentModel
      .findOne({
        post: new Types.ObjectId(input.postId),
        authorEmail: input.authorEmail,
        parent: input.parentId ? new Types.ObjectId(input.parentId) : null,
        deletedAt: null,
        createdAt: { $gte: new Date(now - BlogCommentsService.USER_MIN_INTERVAL_MS) },
      })
      .sort({ createdAt: -1 })
      .lean();

    if (recent) {
      throw new BadRequestException('Bạn đang thao tác quá nhanh, vui lòng thử lại sau vài giây');
    }

    const duplicated = await this.commentModel.findOne({
      post: new Types.ObjectId(input.postId),
      authorEmail: input.authorEmail,
      content: input.content,
      parent: input.parentId ? new Types.ObjectId(input.parentId) : null,
      deletedAt: null,
      createdAt: { $gte: new Date(now - BlogCommentsService.USER_DUPLICATE_WINDOW_MS) },
    }).lean();

    if (duplicated) {
      throw new BadRequestException('Nội dung bình luận bị trùng lặp, vui lòng chỉnh sửa trước khi gửi');
    }
  }

  private async getAccountIdentity(userId: string): Promise<{ id: Types.ObjectId; email: string; name: string } | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const accountId = new Types.ObjectId(userId);
    const account = await this.accountModel
      .findById(accountId)
      .select({ firstName: 1, lastName: 1, email: 1 })
      .lean();

    if (!account?.email) {
      return null;
    }

    const fullName = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
    return {
      id: accountId,
      email: account.email,
      name: fullName || account.email,
    };
  }

  private assertOwner(comment: BlogComment, userId: Types.ObjectId, userEmail: string) {
    const ownerById = comment.user ? String(comment.user) === String(userId) : false;
    const ownerByEmail = !!comment.authorEmail && comment.authorEmail === userEmail;

    if (!ownerById && !ownerByEmail) {
      throw new ForbiddenException('Bạn không có quyền thao tác với bình luận này');
    }
  }
}