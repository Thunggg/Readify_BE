import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book } from '../schemas/book.schema';
import { SearchPublicBooksDto } from '../dto/search-public-books.dto';
import { ApiResponse } from '../../../shared/responses/api-response';
import { ErrorResponse } from '../../../shared/responses/error.response';
import { SortOrder } from 'mongoose';
import { SearchBookSuggestionsDto } from '../dto/search-book-suggestions.dto';

@Injectable()
export class BooksPublicService {
  constructor(@InjectModel(Book.name) private readonly bookModel: Model<Book>) {}

  async getBooksList(query: SearchPublicBooksDto) {
    // ===== pagination =====
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 12, 50);
    const skip = (page - 1) * limit;

    // ===== base filter (public) =====
    const filter: Record<string, any> = {
      isDeleted: false,
      status: 1, // published / active
    };

    // ===== category filter =====
    if (query.categoryId) {
      if (!Types.ObjectId.isValid(query.categoryId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'categoryId', message: 'Invalid categoryId' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      filter.categoryIds = new Types.ObjectId(query.categoryId);
    }

    // ===== price filter =====
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.basePrice = {};
      if (query.minPrice !== undefined) filter.basePrice.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.basePrice.$lte = query.maxPrice;
    }

    // ===== stock filter =====
    if (query.inStock === true) {
      filter.stockOnHand = { $gt: 0 };
    }

    // ===== search =====
    const keyword = query.q?.trim();
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { slug: { $regex: keyword, $options: 'i' } },
        { authors: { $elemMatch: { $regex: keyword, $options: 'i' } } },
        { isbn: { $regex: keyword, $options: 'i' } },
      ];
    }

    // ===== sort =====
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { basePrice: 1, createdAt: -1 },
      price_desc: { basePrice: -1, createdAt: -1 },
      best_selling: { soldCount: -1, createdAt: -1 },
    };

    const sort = sortMap[query.sort ?? 'newest'] || sortMap.newest;

    // ===== query =====
    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .select({
          title: 1,
          slug: 1,
          authors: 1,
          thumbnailUrl: 1,
          basePrice: 1,
          originalPrice: 1,
          currency: 1,
          averageRating: 1,
          totalReviews: 1,
          soldCount: 1,
          categoryIds: 1,
          stockOnHand: 1,
          createdAt: 1,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.bookModel.countDocuments(filter),
    ]);

    return ApiResponse.success(
      {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      'Get books list successfully',
    );
  }

  async getBookSuggestions(query: SearchBookSuggestionsDto) {
    const keyword = query.q?.trim();
    const limit = Math.min(query.limit ?? 6, 10);

    // Không search khi keyword quá ngắn
    if (!keyword || keyword.length < 2) {
      return ApiResponse.success({ items: [] });
    }

    const items = await this.bookModel
      .find({
        isDeleted: false,
        status: 1,
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { slug: { $regex: keyword, $options: 'i' } },
          { authors: { $elemMatch: { $regex: keyword, $options: 'i' } } },
        ],
      })
      .select({
        title: 1,
        slug: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        authors: 1,
      })
      .sort({ soldCount: -1 })
      .limit(limit)
      .lean();

    return ApiResponse.success({ items });
  }

  async getBookDetailById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const book = await this.bookModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false, status: 1 })
      .select({
        title: 1,
        slug: 1,
        subtitle: 1,
        description: 1,
        authors: 1,
        language: 1,
        publishDate: 1,
        pageCount: 1,
        isbn: 1,
        publisherId: 1,
        categoryIds: 1,
        images: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        originalPrice: 1,
        currency: 1,
        averageRating: 1,
        totalReviews: 1,
        soldCount: 1,
        stockOnHand: 1,
        createdAt: 1,
      })
      // populate
      .populate('publisherId', 'name')
      .populate('categoryIds', 'name slug')
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    return ApiResponse.success(book, 'Get book detail successfully');
  }

  async getBookDetailBySlug(slug: string) {
    const s = slug?.trim().toLowerCase();
    if (!s) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const book = await this.bookModel
      .findOne({ slug: s, isDeleted: false, status: 1 })
      .select({
        title: 1,
        slug: 1,
        subtitle: 1,
        description: 1,
        authors: 1,
        language: 1,
        publishDate: 1,
        pageCount: 1,
        isbn: 1,
        publisherId: 1,
        categoryIds: 1,
        images: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        originalPrice: 1,
        currency: 1,
        averageRating: 1,
        totalReviews: 1,
        soldCount: 1,
        stockOnHand: 1,
        createdAt: 1,
      })
      // populate
      .populate('publisherId', 'name')
      .populate('categoryIds', 'name slug')
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    return ApiResponse.success(book, 'Get book detail successfully');
  }

  async getRelatedBooks(bookId: string, limitParam?: string) {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const limit = Math.min(Math.max(parseInt(limitParam ?? '8', 10) || 8, 1), 20);

    // 1) Load current book (để lấy categoryIds/authors)
    const book = await this.bookModel
      .findOne({ _id: new Types.ObjectId(bookId), isDeleted: false, status: 1 })
      .select({ categoryIds: 1, authors: 1 })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    const categoryIds = (book.categoryIds ?? []).map((id: any) => new Types.ObjectId(String(id)));
    const authors = (book.authors ?? []).map((a: any) => String(a).trim()).filter(Boolean);

    // 2) Build related filter
    const filter: Record<string, any> = {
      _id: { $ne: new Types.ObjectId(bookId) },
      isDeleted: false,
      status: 1,
    };

    const or: any[] = [];
    if (categoryIds.length > 0) or.push({ categoryIds: { $in: categoryIds } });
    if (authors.length > 0) or.push({ authors: { $in: authors } });

    // Nếu book không có categoryIds + authors, fallback: newest
    if (or.length > 0) filter.$or = or;

    // 3) Query related
    const items = await this.bookModel
      .find(filter)
      .select({
        title: 1,
        slug: 1,
        authors: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        originalPrice: 1,
        currency: 1,
        averageRating: 1,
        totalReviews: 1,
        soldCount: 1,
        categoryIds: 1,
        createdAt: 1,
      })
      // Sort đơn giản: ưu tiên bán chạy + mới
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return ApiResponse.success({ items }, 'Get related books successfully');
  }

  async getRelatedBookBySlug(bookSlug: string, limitParam?: string) {
    const slug = bookSlug?.trim().toLowerCase();
    if (!slug) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const limit = Math.min(Math.max(parseInt(limitParam ?? '8', 10) || 8, 1), 20);

    const book = await this.bookModel
      .findOne({ slug, isDeleted: false, status: 1 })
      .select({ _id: 1, categoryIds: 1, authors: 1 })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    const categoryIds = (book.categoryIds ?? []).map((id: any) => new Types.ObjectId(String(id)));
    const authors = (book.authors ?? []).map((a: any) => String(a).trim()).filter(Boolean);

    const filter: Record<string, any> = {
      _id: { $ne: book._id },
      isDeleted: false,
      status: 1,
    };

    const or: any[] = [];
    if (categoryIds.length) or.push({ categoryIds: { $in: categoryIds } });
    if (authors.length) or.push({ authors: { $in: authors } });

    if (or.length) filter.$or = or;

    const items = await this.bookModel
      .find(filter)
      .select({
        title: 1,
        slug: 1,
        authors: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        originalPrice: 1,
        currency: 1,
        averageRating: 1,
        totalReviews: 1,
        soldCount: 1,
        categoryIds: 1,
        createdAt: 1,
      })
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return ApiResponse.success({ items }, 'Get related books successfully');
  }
}
