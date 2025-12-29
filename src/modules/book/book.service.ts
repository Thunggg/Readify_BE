import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './schemas/book.mongoose.schema';
import { ListBooksDto, BookSortBy, SortOrder } from './dto/list-books.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  async getBooksList(query: ListBooksDto) {
    const {
      q,
      author,
      categoryId,
      sortBy = BookSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

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
        { title: { $regex: searchTerm, $options: 'i' } },
        { author: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { isbn: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // FILTER BY AUTHOR
    if (author?.trim()) {
      filter.author = { $regex: author.trim(), $options: 'i' };
    }

    // FILTER BY CATEGORY
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'categoryId', message: 'Invalid category ID' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      filter.categories = new Types.ObjectId(categoryId);
    }

    // SORT
    const sortMap: Record<string, any> = {
      [BookSortBy.CREATED_AT]: { createdAt: order === SortOrder.ASC ? 1 : -1 },
      [BookSortBy.UPDATED_AT]: { updatedAt: order === SortOrder.ASC ? 1 : -1 },
      [BookSortBy.TITLE]: { title: order === SortOrder.ASC ? 1 : -1 },
      [BookSortBy.AUTHOR]: { author: order === SortOrder.ASC ? 1 : -1 },
      [BookSortBy.PUBLISHED_DATE]: { publishedDate: order === SortOrder.ASC ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .populate('categories', 'name')
        .select({
          _id: 1,
          title: 1,
          author: 1,
          isbn: 1,
          description: 1,
          categories: 1,
          publishedDate: 1,
          coverUrl: 1,
          pages: 1,
          publisher: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.bookModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách sách thành công',
    );
  }
}

