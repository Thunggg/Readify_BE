import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ListReviewsDto, ReviewSortBy, SortOrder } from './dto/list-reviews.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { AccountRole } from '../staff/constants/staff.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  async createReview(dto: CreateReviewDto, currentUserId: string) {
    // Validate bookId
    if (!Types.ObjectId.isValid(dto.bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookId', message: 'Invalid book ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if book exists
    const book = await this.bookModel.findOne({
      _id: new Types.ObjectId(dto.bookId),
      isDeleted: { $ne: true },
    });

    if (!book) {
      throw new HttpException(
        ErrorResponse.notFound('Book not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if user already reviewed this book
    const existingReview = await this.reviewModel.findOne({
      userId: new Types.ObjectId(currentUserId),
      bookId: new Types.ObjectId(dto.bookId),
      isActive: true,
    });

    if (existingReview) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookId', message: 'You have already reviewed this book' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate orderId if provided
    if (dto.orderId) {
      if (!Types.ObjectId.isValid(dto.orderId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'orderId', message: 'Invalid order ID' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Create review
    const review = await this.reviewModel.create({
      userId: new Types.ObjectId(currentUserId),
      bookId: new Types.ObjectId(dto.bookId),
      orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
      rating: dto.rating,
      comment: dto.comment?.trim(),
      status: ReviewStatus.PENDING,
      isActive: true,
    });

    // Update book rating summary (only if approved, but we'll update on approval)
    // For now, we'll update it immediately for simplicity
    await this.updateBookRatingSummary(dto.bookId);

    const reviewData = await this.reviewModel
      .findById(review._id)
      .populate('userId', 'email firstName lastName')
      .populate('bookId', 'title slug')
      .select({
        _id: 1,
        userId: 1,
        bookId: 1,
        orderId: 1,
        rating: 1,
        comment: 1,
        status: 1,
        helpfulCount: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    return ApiResponse.success(reviewData, 'Tạo đánh giá thành công', 201);
  }

  async getReviewsList(query: ListReviewsDto, currentUserId?: string, currentUserRole?: number) {
    const {
      bookId,
      userId,
      rating,
      status,
      sortBy = ReviewSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // BASE FILTER
    const baseFilter: any = {
      isActive: true,
    };

    // Only show approved reviews to non-admin users
    const isAdmin = currentUserRole === AccountRole.ADMIN;
    if (!isAdmin) {
      baseFilter.status = ReviewStatus.APPROVED;
    } else if (status) {
      baseFilter.status = status;
    }

    if (bookId) {
      if (!Types.ObjectId.isValid(bookId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'bookId', message: 'Invalid book ID' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      baseFilter.bookId = new Types.ObjectId(bookId);
    }

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      baseFilter.userId = new Types.ObjectId(userId);
    }

    if (rating) {
      baseFilter.rating = rating;
    }

    // SORT
    const sortMap: Record<string, any> = {
      [ReviewSortBy.CREATED_AT]: { createdAt: order === SortOrder.ASC ? 1 : -1 },
      [ReviewSortBy.RATING]: { rating: order === SortOrder.ASC ? 1 : -1 },
      [ReviewSortBy.HELPFUL_COUNT]: { helpfulCount: order === SortOrder.ASC ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.reviewModel
        .find(baseFilter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .populate('userId', 'email firstName lastName')
        .populate('bookId', 'title slug thumbnailUrl')
        .select({
          _id: 1,
          userId: 1,
          bookId: 1,
          orderId: 1,
          rating: 1,
          comment: 1,
          status: 1,
          helpfulCount: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.reviewModel.countDocuments(baseFilter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách đánh giá thành công',
    );
  }

  async getReviewDetail(reviewId: string, currentUserId?: string, currentUserRole?: number) {
    // Validate reviewId
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid review ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const baseFilter: any = {
      _id: new Types.ObjectId(reviewId),
      isActive: true,
    };

    // Non-admin users can only see approved reviews
    const isAdmin = currentUserRole === AccountRole.ADMIN;
    if (!isAdmin) {
      baseFilter.status = ReviewStatus.APPROVED;
    }

    const review = await this.reviewModel
      .findOne(baseFilter)
      .populate('userId', 'email firstName lastName')
      .populate('bookId', 'title slug thumbnailUrl')
      .select({
        _id: 1,
        userId: 1,
        bookId: 1,
        orderId: 1,
        rating: 1,
        comment: 1,
        status: 1,
        helpfulCount: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!review) {
      throw new HttpException(
        ErrorResponse.notFound('Review not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    return ApiResponse.success(review, 'Lấy chi tiết đánh giá thành công', 200);
  }

  async updateReview(reviewId: string, dto: UpdateReviewDto, currentUserId: string, currentUserRole?: number) {
    // Validate reviewId
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid review ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      isActive: true,
    });

    if (!review) {
      throw new HttpException(
        ErrorResponse.notFound('Review not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Check permission: user can only update their own reviews, admin can update any
    const isAdmin = currentUserRole === AccountRole.ADMIN;
    const isOwner = review.userId.toString() === currentUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Only admin can change status
    if (dto.status !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admin can change review status');
    }

    // Update fields
    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }

    if (dto.comment !== undefined) {
      review.comment = dto.comment.trim();
    }

    if (dto.status !== undefined && isAdmin) {
      review.status = dto.status;
    }

    await review.save();

    // Update book rating summary if rating or status changed
    if (dto.rating !== undefined || dto.status !== undefined) {
      await this.updateBookRatingSummary(review.bookId.toString());
    }

    const reviewData = await this.reviewModel
      .findById(review._id)
      .populate('userId', 'email firstName lastName')
      .populate('bookId', 'title slug thumbnailUrl')
      .select({
        _id: 1,
        userId: 1,
        bookId: 1,
        orderId: 1,
        rating: 1,
        comment: 1,
        status: 1,
        helpfulCount: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    return ApiResponse.success(reviewData, 'Cập nhật đánh giá thành công', 200);
  }

  async deleteReview(reviewId: string, currentUserId: string, currentUserRole?: number) {
    // Validate reviewId
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid review ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      isActive: true,
    });

    if (!review) {
      throw new HttpException(
        ErrorResponse.notFound('Review not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Check permission: user can only delete their own reviews, admin can delete any
    const isAdmin = currentUserRole === AccountRole.ADMIN;
    const isOwner = review.userId.toString() === currentUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Soft delete
    review.isActive = false;
    await review.save();

    // Update book rating summary
    await this.updateBookRatingSummary(review.bookId.toString());

    return ApiResponse.success({ _id: reviewId }, 'Xóa đánh giá thành công', 200);
  }

  async getBookReviews(bookId: string, page: number = 1, limit: number = 10) {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookId', message: 'Invalid book ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const baseFilter = {
      bookId: new Types.ObjectId(bookId),
      status: ReviewStatus.APPROVED,
      isActive: true,
    };

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(baseFilter)
        .sort({ createdAt: -1, _id: 1 })
        .skip(skip)
        .limit(validLimit)
        .populate('userId', 'email firstName lastName')
        .select({
          _id: 1,
          userId: 1,
          rating: 1,
          comment: 1,
          helpfulCount: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.reviewModel.countDocuments(baseFilter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách đánh giá sách thành công',
    );
  }

  async getBookRatingSummary(bookId: string) {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookId', message: 'Invalid book ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const book = await this.bookModel.findOne({
      _id: new Types.ObjectId(bookId),
      isDeleted: { $ne: true },
    });

    if (!book) {
      throw new HttpException(
        ErrorResponse.notFound('Book not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Get rating statistics
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          bookId: new Types.ObjectId(bookId),
          status: ReviewStatus.APPROVED,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating',
          },
        },
      },
    ]);

    let ratingAvg = 0;
    let ratingCount = 0;
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    if (stats.length > 0) {
      ratingAvg = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
      ratingCount = stats[0].totalReviews;

      // Calculate distribution
      stats[0].ratingDistribution.forEach((rating: number) => {
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating as keyof typeof ratingDistribution]++;
        }
      });
    }

    return ApiResponse.success(
      {
        bookId,
        ratingAvg,
        ratingCount,
        ratingDistribution,
      },
      'Lấy thống kê đánh giá sách thành công',
      200,
    );
  }

  async markHelpful(reviewId: string, currentUserId: string) {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid review ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      status: ReviewStatus.APPROVED,
      isActive: true,
    });

    if (!review) {
      throw new HttpException(
        ErrorResponse.notFound('Review not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Prevent user from marking their own review as helpful
    if (review.userId.toString() === currentUserId) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'You cannot mark your own review as helpful' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Increment helpful count
    review.helpfulCount += 1;
    await review.save();

    return ApiResponse.success(
      { _id: reviewId, helpfulCount: review.helpfulCount },
      'Đánh dấu đánh giá hữu ích thành công',
      200,
    );
  }

  // Private helper methods
  private async updateBookRatingSummary(bookId: string) {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          bookId: new Types.ObjectId(bookId),
          status: ReviewStatus.APPROVED,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    let ratingAvg = 0;
    let ratingCount = 0;

    if (stats.length > 0) {
      ratingAvg = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
      ratingCount = stats[0].totalReviews;
    }

    // Update book document
    await this.bookModel.updateOne(
      { _id: new Types.ObjectId(bookId) },
      {
        $set: {
          ratingAvg,
          ratingCount,
        },
      },
    );
  }
}

