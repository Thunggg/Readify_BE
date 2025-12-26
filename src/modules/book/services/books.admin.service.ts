import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';
import { SearchAdminBooksDto } from '../dto/search-admin-books.dto';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { ApiResponse } from '../../../shared/responses/api-response';
import { ErrorResponse } from '../../../shared/responses/error.response';
import { Stock } from 'src/modules/stock/schemas/stock.schema';
import { Media } from 'src/modules/media/schemas/media.schema';
import { Category } from 'src/modules/categories/schemas/category.schema';

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class BooksAdminService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
  ) {}

  // View books list for dashboard
  async getAdminBookList(query: SearchAdminBooksDto) {
    const {
      q,
      publisherId,
      categoryId,
      status,
      isDeleted,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // ===== FILTER =====
    const filter: any = {};

    // default: không lấy sách đã xoá
    if (isDeleted === true) filter.isDeleted = true;
    else filter.isDeleted = { $ne: true };

    if (status !== undefined) filter.status = status;

    if (publisherId) {
      if (!Types.ObjectId.isValid(publisherId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'publisherId', message: 'Invalid publisherId' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      filter.publisherId = new Types.ObjectId(publisherId);
    }

    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'categoryId', message: 'Invalid categoryId' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      filter.categoryIds = new Types.ObjectId(categoryId);
    }

    if (q?.trim()) {
      const kw = escapeRegex(q.trim());
      filter.$or = [
        { title: { $regex: kw, $options: 'i' } },
        { subtitle: { $regex: kw, $options: 'i' } },
        { isbn: { $regex: kw, $options: 'i' } },
        { authors: { $elemMatch: { $regex: kw, $options: 'i' } } },
      ];
    }

    // ===== SORT =====
    const orderNum = order === 'asc' ? 1 : -1;
    const sortMap: Record<string, any> = {
      createdAt: { createdAt: orderNum },
      updatedAt: { updatedAt: orderNum },
      title: { title: orderNum },
      basePrice: { basePrice: orderNum },
      soldCount: { soldCount: orderNum },
    };

    const sortStage = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1, // tie-breaker
    };

    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort(sortStage)
        .skip(skip)
        .limit(validLimit)
        .select({
          title: 1,
          slug: 1,
          thumbnailUrl: 1,
          basePrice: 1,
          originalPrice: 1,
          currency: 1,
          publisherId: 1,
          categoryIds: 1,
          status: 1,
          isDeleted: 1,
          soldCount: 1,
          stockOnHand: 1,
          stockReserved: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.bookModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      { page: validPage, limit: validLimit, total },
      'Successfully retrieved the book list for the dashboard',
    );
  }

  // View book detail for dashboard
  async getAdminBookDetail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const book = await this.bookModel
      .findById(id)
      .select({
        title: 1,
        slug: 1,
        subtitle: 1,
        description: 1,
        authors: 1,
        language: 1,
        format: 1,
        publishDate: 1,
        pageCount: 1,
        isbn: 1,
        publisherId: 1,
        categoryIds: 1,
        basePrice: 1,
        originalPrice: 1,
        currency: 1,
        images: 1,
        thumbnailUrl: 1,
        status: 1,
        isDeleted: 1,
        deletedAt: 1,
        soldCount: 1,
        tags: 1,
        stockOnHand: 1,
        stockReserved: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    return ApiResponse.success(book, 'Successfully retrieved the book details for the dashboard');
  }

  async addBook(dto: CreateBookDto, staffId?: string) {
    const slugSource = dto.slug?.trim() || dto.title;

    if (!slugSource) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug or title is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = slugSource
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');

    if (!slug) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Cannot generate slug from title/slug' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const slugExists = await this.bookModel.exists({ slug, isDeleted: false });
    if (slugExists) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug already exists' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.isbn?.trim()) {
      const isbn = dto.isbn.trim();
      const isbnExists = await this.bookModel.exists({ isbn, isDeleted: false });
      if (isbnExists) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'isbn', message: 'ISBN already exists' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (!dto.categoryIds?.length) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'categoryIds', message: 'categoryIds is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!Types.ObjectId.isValid(dto.publisherId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'publisherId', message: 'Invalid publisherId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.basePrice === undefined || dto.basePrice === null) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'basePrice', message: 'basePrice is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const categoryIds = (dto.categoryIds ?? []).map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'categoryIds', message: `Invalid categoryId: ${id}` }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      return new Types.ObjectId(id);
    });

    if (!dto.coverMediaId || !Types.ObjectId.isValid(dto.coverMediaId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'coverMediaId', message: 'Invalid coverMediaId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const galleryMediaIds = (dto.galleryMediaIds ?? []).map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'galleryMediaIds', message: `Invalid mediaId: ${id}` }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      return id;
    });

    const allMediaIds = [dto.coverMediaId, ...galleryMediaIds].map((id) => new Types.ObjectId(id));

    // ===== transaction =====
    const session = await this.connection.startSession();

    try {
      let createdBook: any;

      await session.withTransaction(async () => {
        // 1) load medias (within tx) + validate count
        const medias = await this.mediaModel
          .find({ _id: { $in: allMediaIds } })
          .select({ _id: 1, url: 1, status: 1, uploadedBy: 1 })
          .session(session)
          .lean();

        // if (medias.length !== allMediaIds.length) {
        //   throw new HttpException(
        //     ErrorResponse.validationError([{ field: 'mediaIds', message: 'One or more media not found' }]),
        //     HttpStatus.BAD_REQUEST,
        //   );
        // }

        // // optional: ensure medias are TEMP (not already attached)
        // const invalid = medias.find((m) => String(m.status) !== 'TEMP');
        // if (invalid) {
        //   throw new HttpException(
        //     ErrorResponse.validationError([{ field: 'mediaIds', message: 'One or more media is not TEMP' }]),
        //     HttpStatus.BAD_REQUEST,
        //   );
        // }

        const cover = medias.find((m) => String(m._id) === dto.coverMediaId);
        if (!cover) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'coverMediaId', message: 'Cover media not found' }]),
            HttpStatus.BAD_REQUEST,
          );
        }

        const gallery = galleryMediaIds.map((id) => medias.find((m) => String(m._id) === id)!);

        const bookPayload = {
          title: dto.title?.trim(),
          slug,
          subtitle: dto.subtitle?.trim(),
          description: dto.description?.trim(),
          authors: dto.authors ?? [],
          language: dto.language?.trim(),
          publishDate: dto.publishDate,
          pageCount: dto.pageCount,
          isbn: dto.isbn?.trim(),
          publisherId: new Types.ObjectId(dto.publisherId),
          categoryIds,
          images: [
            { kind: 'cover' as const, mediaId: cover._id, url: cover.url },
            ...gallery.map((m) => ({
              kind: 'gallery' as const,
              mediaId: m._id,
              url: m.url,
            })),
          ],
          basePrice: dto.basePrice,
          originalPrice: dto.originalPrice,
          currency: dto.currency?.trim() || 'VND',
          thumbnailUrl: cover.url,
          status: dto.status ?? 1,
          tags: dto.tags ?? [],
          isDeleted: false,
          soldCount: 0,
          stockOnHand: 0,
          stockReserved: 0,
        } satisfies Partial<Book>;

        const book = await new this.bookModel(bookPayload).save({ session });
        createdBook = book;
        const stockPayload = {
          bookId: book._id,
          quantity: dto.initialQuantity ?? 0,
          location: dto.stockLocation ?? 'MAIN',
          price: dto.importPrice,
          lastUpdated: new Date(),
          status: 'available',
        } satisfies Partial<Stock>;

        await new this.stockModel(stockPayload).save({ session });

        // attach medias -> Book
        const attachRes = await this.mediaModel.updateMany(
          { _id: { $in: allMediaIds }, status: 'TEMP' },
          {
            $set: {
              status: 'ATTACHED',
              attachedTo: { model: 'Book', id: book._id },
            },
          },
          { session },
        );

        // Nếu vì lý do nào đó không update đủ (race condition), thì throw để rollback
        // if ((attachRes.modifiedCount ?? 0) !== allMediaIds.length) {
        //   throw new HttpException(
        //     ErrorResponse.validationError([{ field: 'mediaIds', message: 'Attach media failed' }]),
        //     HttpStatus.CONFLICT,
        //   );
        // }
      });

      return ApiResponse.success(createdBook, 'Tạo sách thành công');
    } finally {
      session.endSession();
    }
  }
}
