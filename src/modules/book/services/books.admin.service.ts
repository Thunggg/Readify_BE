import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';
import { Author } from '../schemas/author.schema';
import { SearchAdminBooksDto } from '../dto/search-admin-books.dto';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
// use response classes directly
import { ErrorResponse } from '../../../shared/responses/error.response';
import { Stock } from 'src/modules/stock/schemas/stock.schema';
import { Media, MediaStatus } from 'src/modules/media/schemas/media.schema';
import { Category } from 'src/modules/categories/schemas/category.schema';
import { Supplier } from 'src/modules/supplier/schemas/supplier.schema';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { BookCurrency, BookLanguage, BookStatus } from '../enums/book.enum';

@Injectable()
export class BooksAdminService {
  private readonly logger = new Logger(BooksAdminService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private readonly authorModel: Model<Author>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Supplier.name) private readonly supplierModel: Model<Supplier>,
  ) {}

  private generateSlug(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
      .replace(/đ/g, 'd') // Chuyển đ -> d
      .replace(/[^a-z0-9\s-]/g, '') // Giữ lại chữ, số, khoảng trắng, gạch ngang
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200); // Giới hạn độ dài slug
  }

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
      const kw = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
          currency: 1,
          publisherId: 1,
          categoryIds: 1,
          status: 1,
          isDeleted: 1,
          soldCount: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.bookModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      items,
      { page: validPage, limit: validLimit, total },
      'Successfully retrieved the book list for the dashboard',
    );
  }

  async getBookBySlug(slug: string) {
    if (!slug?.trim()) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const book = await this.bookModel
      .findOne({ slug: slug.toLowerCase().trim(), isDeleted: false })
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
        basePrice: 1,
        currency: 1,
        images: 1,
        thumbnailUrl: 1,
        status: 1,
        soldCount: 1,
        tags: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      // populate
      .populate('publisherId', 'name')
      .populate('categoryIds', 'name slug')
      .populate('images', 'url ')
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(book, 'Successfully retrieved the book by slug');
  }

  async getDeletedBookBySlug(slug: string) {
    if (!slug?.trim()) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const book = await this.bookModel
      .findOne({ slug: slug.toLowerCase().trim(), isDeleted: true })
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
        basePrice: 1,
        currency: 1,
        images: 1,
        thumbnailUrl: 1,
        status: 1,
        soldCount: 1,
        tags: 1,
        isDeleted: 1,
        deletedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Deleted book not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(book, 'Successfully retrieved the deleted book by slug');
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
        publishDate: 1,
        pageCount: 1,
        isbn: 1,
        publisherId: 1,
        categoryIds: 1,
        basePrice: 1,
        currency: 1,
        images: 1,
        thumbnailUrl: 1,
        status: 1,
        isDeleted: 1,
        deletedAt: 1,
        soldCount: 1,
        tags: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(book, 'Successfully retrieved the book details for the dashboard');
  }

  /**
   * Tạo sách mới với validation đầy đủ
   * Validates: slug, ISBN, publisher, categories, authors, images
   */
  async addBook(dto: CreateBookDto) {
    // ===== XỬ LÝ SLUG TỰ ĐỘNG =====
    const slugSource = dto.slug?.trim() || dto.title.trim();

    if (!slugSource) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Cannot generate slug: title is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hàm tạo slug với xử lý tiếng Việt
    const generateSlug = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd') // Xử lý chữ đ
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 200);
    };

    let slug = generateSlug(slugSource);

    if (!slug) {
      slug = `book-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    // Kiểm tra publishDate không được ở tương lai
    if (dto.publishDate && new Date(dto.publishDate) > new Date()) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'publishDate', message: 'Publish date cannot be in the future' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra publisher tồn tại và không bị xóa
    const publisher = await this.supplierModel
      .findById(dto.publisherId)
      .select({ _id: 1, isDeleted: 1, name: 1 })
      .lean();

    if (!publisher) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'publisherId', message: 'Publisher not found' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (publisher.isDeleted === true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'publisherId', message: 'Publisher is deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra categories tồn tại và không bị xóa
    const categoryIds = dto.categoryIds.map((id) => new Types.ObjectId(id));

    const categories = await this.categoryModel
      .find({ _id: { $in: categoryIds } })
      .select({ _id: 1, isDeleted: 1, name: 1 })
      .lean();

    if (categories.length !== categoryIds.length) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'categoryIds', message: 'One or more categories not found' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const deletedCategory = categories.find((c) => c.isDeleted === true);
    if (deletedCategory) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'categoryIds', message: 'One or more categories are deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate authors nếu có
    let authorIds: Types.ObjectId[] = [];
    if (dto.authors?.length) {
      authorIds = dto.authors.map((id) => new Types.ObjectId(id));

      const authors = await this.authorModel
        .find({ _id: { $in: authorIds } })
        .select({ _id: 1, status: 1, name: 1 })
        .lean();

      if (authors.length !== authorIds.length) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'authors', message: 'One or more authors not found' }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      const inactiveAuthor = authors.find((a) => a.status !== 'active');
      if (inactiveAuthor) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'authors', message: 'One or more authors are not active' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate images
    const imageIds = (dto.images ?? []).map((id) => new Types.ObjectId(id));

    // TRANSACTION
    const session = await this.connection.startSession();

    try {
      let createdBook: any;

      await session.withTransaction(async () => {
        let finalSlug = slug;
        let counter = 1;

        while (
          await this.bookModel
            .exists({
              slug: finalSlug,
              isDeleted: false,
            })
            .session(session)
        ) {
          finalSlug = `${slug}-${counter}`;
          counter++;

          if (counter > 100) {
            throw new HttpException(
              ErrorResponse.validationError([
                {
                  field: 'slug',
                  message: 'Cannot generate unique slug. Please provide a different title or slug.',
                },
              ]),
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        // 2. Kiểm tra ISBN uniqueness trong transaction
        if (dto.isbn?.trim()) {
          const isbn = dto.isbn.trim();
          const isbnExists = await this.bookModel
            .exists({
              isbn,
              isDeleted: false,
            })
            .session(session);

          if (isbnExists) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'isbn', message: 'ISBN already exists' }]),
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        // 3. Validate images trong transaction
        let thumbnailUrl = dto.thumbnailUrl;

        if (imageIds.length > 0) {
          const medias = await this.mediaModel
            .find({
              _id: { $in: imageIds },
              // status: 'TEMP',
            })
            .select({ _id: 1, url: 1, status: 1, uploadedBy: 1 })
            .session(session)
            .lean();

          if (medias.length !== imageIds.length) {
            throw new HttpException(
              ErrorResponse.validationError([
                {
                  field: 'images',
                  message: 'One or more media not found or not in TEMP status',
                },
              ]),
              HttpStatus.BAD_REQUEST,
            );
          }

          if (!thumbnailUrl && medias.length > 0) {
            thumbnailUrl = medias[0].url;
          }
        }

        // ===== TẠO BOOK =====
        const bookPayload = {
          title: dto.title.trim(),
          slug: finalSlug,
          subtitle: dto.subtitle?.trim(),
          description: dto.description?.trim(),
          authors: authorIds,
          language: dto.language as BookLanguage,
          publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
          pageCount: dto.pageCount,
          isbn: dto.isbn?.trim(),
          publisherId: new Types.ObjectId(dto.publisherId),
          categoryIds,
          images: imageIds,
          thumbnailUrl: thumbnailUrl,
          basePrice: dto.basePrice,
          currency: dto.currency || BookCurrency.VND,
          status: BookStatus.DRAFT,
          tags: dto.tags || [],
          isDeleted: false,
          soldCount: 0,
          publishedAt: undefined,
        } satisfies Partial<Book>;

        const book = await new this.bookModel(bookPayload).save({ session });
        createdBook = book;

        // ===== TẠO STOCK =====
        const stockPayload = {
          bookId: book._id,
          quantity: dto.initialQuantity ?? 0,
          location: dto.stockLocation ?? 'MAIN',
          lastUpdated: new Date(),
          status: dto.initialQuantity && dto.initialQuantity > 0 ? 'available' : 'out_of_stock',
        } satisfies Partial<Stock>;

        await new this.stockModel(stockPayload).save({ session });

        // ===== CẬP NHẬT MEDIA STATUS =====
        if (imageIds.length > 0) {
          await this.mediaModel.updateMany(
            { _id: { $in: imageIds } },
            {
              $set: {
                status: 'ATTACHED',
                // attachedTo: 'BOOK',
                // attachedId: book._id,
                updatedAt: new Date(),
              },
            },
            { session },
          );
        }
      });

      return new SuccessResponse(createdBook, 'Book created successfully');
    } catch (error) {
      this.logger.error(`Failed to create book: ${error.message}`, error.stack);

      // Nếu đã là HttpException thì re-throw
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(ErrorResponse.badRequest('Failed to create book'), HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      session.endSession();
    }
  }

  // async updateBook(id: string, dto: UpdateBookDto, staffId?: string) {
  //   if (!Types.ObjectId.isValid(id)) {
  //     throw new HttpException(
  //       ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   const session = await this.connection.startSession();

  //   try {
  //     let updatedBook: Book | null = null;

  //     await session.withTransaction(async () => {
  //       // ===== 1) Load book (NO lean) =====
  //       const book = await this.bookModel.findById(id).session(session);
  //       if (!book) {
  //         throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
  //       }
  //       if (book.isDeleted) {
  //         throw new HttpException(
  //           ErrorResponse.validationError([{ field: 'id', message: 'Book is deleted' }]),
  //           HttpStatus.BAD_REQUEST,
  //         );
  //       }

  //       // ===== 2) Update basic fields =====
  //       if (dto.title?.trim()) book.title = dto.title.trim();
  //       if (dto.subtitle !== undefined) book.subtitle = dto.subtitle?.trim();
  //       if (dto.description !== undefined) book.description = dto.description?.trim();
  //       // if (dto.authors !== undefined) book.authors = dto.authors;
  //       if (dto.language !== undefined) book.language = dto.language?.trim();
  //       if (dto.publishDate !== undefined) book.publishDate = dto.publishDate;
  //       if (dto.pageCount !== undefined) book.pageCount = dto.pageCount;
  //       if (dto.basePrice !== undefined) book.basePrice = dto.basePrice;
  //       if (dto.currency !== undefined) book.currency = dto.currency?.trim() || 'VND';
  //       if (dto.status !== undefined) book.status = dto.status;
  //       if (dto.tags !== undefined) book.tags = dto.tags;

  //       // ===== 3) Slug handling =====
  //       if (dto.slug?.trim() || dto.title?.trim()) {
  //         const slugSource = dto.slug?.trim() || dto.title!.trim();
  //         const slug = slugSource
  //           .toLowerCase()
  //           .normalize('NFD')
  //           .replace(/[\u0300-\u036f]/g, '')
  //           .replace(/[^a-z0-9]+/g, '-')
  //           .replace(/^-+|-+$/g, '')
  //           .replace(/-+/g, '-');

  //         if (!slug) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'slug', message: 'Cannot generate slug' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         if (slug !== book.slug) {
  //           const exists = await this.bookModel.exists({
  //             slug,
  //             isDeleted: false,
  //             _id: { $ne: book._id },
  //           });
  //           if (exists) {
  //             throw new HttpException(
  //               ErrorResponse.validationError([{ field: 'slug', message: 'Slug already exists' }]),
  //               HttpStatus.BAD_REQUEST,
  //             );
  //           }
  //           book.slug = slug;
  //         }
  //       }

  //       // ===== 3.1) Validate categoryIds if provided =====
  //       if (dto.categoryIds !== undefined) {
  //         if (!dto.categoryIds?.length) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'categoryIds', message: 'categoryIds cannot be empty' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         // Check for duplicate categoryIds
  //         const uniqueCategoryIds = [...new Set(dto.categoryIds)];
  //         if (uniqueCategoryIds.length !== dto.categoryIds.length) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'categoryIds', message: 'Duplicate categoryIds detected' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         const categoryIds = dto.categoryIds.map((id) => {
  //           if (!Types.ObjectId.isValid(id)) {
  //             throw new HttpException(
  //               ErrorResponse.validationError([{ field: 'categoryIds', message: `Invalid categoryId: ${id}` }]),
  //               HttpStatus.BAD_REQUEST,
  //             );
  //           }
  //           return new Types.ObjectId(id);
  //         });

  //         // Validate categories exist and are not deleted
  //         const categories = await this.categoryModel
  //           .find({ _id: { $in: categoryIds } })
  //           .select({ _id: 1, isDeleted: 1 })
  //           .session(session)
  //           .lean();

  //         if (categories.length !== categoryIds.length) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'categoryIds', message: 'One or more categories not found' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         const deletedCategory = categories.find((c) => c.isDeleted === true);
  //         if (deletedCategory) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'categoryIds', message: 'One or more categories are deleted' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         book.categoryIds = categoryIds;
  //       }

  //       // ===== 3.2) Validate publisherId if provided =====
  //       if (dto.publisherId !== undefined) {
  //         if (!Types.ObjectId.isValid(dto.publisherId)) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'publisherId', message: 'Invalid publisherId' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         // Validate publisher (supplier) exists and is not deleted
  //         const publisher = await this.supplierModel
  //           .findById(dto.publisherId)
  //           .select({ _id: 1, isDeleted: 1 })
  //           .session(session)
  //           .lean();

  //         if (!publisher) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'publisherId', message: 'Publisher not found' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         if (publisher.isDeleted === true) {
  //           throw new HttpException(
  //             ErrorResponse.validationError([{ field: 'publisherId', message: 'Publisher is deleted' }]),
  //             HttpStatus.BAD_REQUEST,
  //           );
  //         }

  //         book.publisherId = new Types.ObjectId(dto.publisherId);
  //       }

  //       // ===== 4) MEDIA =====
  //       let currentImages = [...(book.images || [])];
  //       const attachIds = new Set<string>();
  //       const detachIds = new Set<string>();

  //       // 4a) Remove images
  //       if (dto.removeImages?.length) {
  //         const removeIds = dto.removeImages.map((id) => {
  //           if (!Types.ObjectId.isValid(id)) {
  //             throw new HttpException(
  //               ErrorResponse.validationError([{ field: 'removeImages', message: `Invalid mediaId: ${id}` }]),
  //               HttpStatus.BAD_REQUEST,
  //             );
  //           }
  //           return String(id);
  //         });

  //         currentImages = currentImages.filter((imgId) => {
  //           const shouldRemove = removeIds.includes(String(imgId));
  //           if (shouldRemove) detachIds.add(String(imgId));
  //           return !shouldRemove;
  //         });
  //       }

  //       // 4b) Add new images
  //       if (dto.addImages?.length) {
  //         const addIds = dto.addImages.map((id) => {
  //           if (!Types.ObjectId.isValid(id)) {
  //             throw new HttpException(
  //               ErrorResponse.validationError([{ field: 'addImages', message: `Invalid mediaId: ${id}` }]),
  //               HttpStatus.BAD_REQUEST,
  //             );
  //           }
  //           return new Types.ObjectId(id);
  //         });

  //         const medias = await this.mediaModel
  //           .find({ _id: { $in: addIds } })
  //           .select({ _id: 1, url: 1, status: 1, uploadedBy: 1 })
  //           .session(session);

  //         // if (medias.length !== addIds.length || medias.some((m) => m.status !== MediaStatus.TEMP)) {
  //         //   throw new HttpException(
  //         //     ErrorResponse.validationError([{ field: 'addImages', message: 'Invalid media' }]),
  //         //     HttpStatus.BAD_REQUEST,
  //         //   );
  //         // }

  //         const existed = new Set(currentImages.map((i) => String(i)));

  //         for (const m of medias) {
  //           if (!existed.has(String(m._id))) {
  //             currentImages.push(m._id);
  //             attachIds.add(String(m._id));
  //           }
  //         }
  //       }

  //       // 4c) Update thumbnailUrl if provided
  //       if (dto.thumbnailUrl !== undefined) {
  //         book.thumbnailUrl = dto.thumbnailUrl?.trim();
  //       }

  //       book.images = currentImages;
  //       await book.save({ session });
  //       updatedBook = book;

  //       // ===== 5) Update Media states =====
  //       if (attachIds.size) {
  //         await this.mediaModel.updateMany(
  //           { _id: { $in: [...attachIds].map((id) => new Types.ObjectId(id)) }, status: 'TEMP' },
  //           { $set: { status: 'ATTACHED' } },
  //           { session },
  //         );
  //       }

  //       if (detachIds.size) {
  //         await this.mediaModel.updateMany(
  //           { _id: { $in: [...detachIds].map((id) => new Types.ObjectId(id)) } },
  //           { $set: { status: 'TEMP' } },
  //           { session },
  //         );
  //       }
  //     });

  //     return new SuccessResponse(updatedBook, 'Book updated successfully');
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async deleteBook(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        const book = await this.bookModel.findById(id).session(session);
        if (!book) {
          throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
        }

        if (book.isDeleted) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'id', message: 'Book already deleted' }]),
            HttpStatus.BAD_REQUEST,
          );
        }

        // Soft delete Book
        const updateData: any = {
          isDeleted: true,
          deletedAt: new Date(),
        };

        await this.bookModel.updateOne({ _id: book._id }, { $set: updateData }, { session });

        await this.stockModel.updateMany(
          { bookId: book._id },
          {
            $set: {
              quantity: 0,
              status: 'inactive',
              lastUpdated: new Date(),
            },
          },
          { session },
        );
      });

      return new SuccessResponse(null, 'Book deleted successfully');
    } finally {
      session.endSession();
    }
  }

  async restoreBook(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        const book = await this.bookModel.findById(id).session(session);
        if (!book) {
          throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
        }

        if (!book.isDeleted) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'id', message: 'Book is not deleted' }]),
            HttpStatus.BAD_REQUEST,
          );
        }

        // Restore Book
        await this.bookModel.updateOne(
          { _id: book._id },
          {
            $set: { isDeleted: false },
            $unset: { deletedAt: 1 },
          },
          { session },
        );

        // Restore stock status
        await this.stockModel.updateMany(
          { bookId: book._id },
          {
            $set: {
              status: 'available',
              lastUpdated: new Date(),
            },
          },
          { session },
        );
      });

      return new SuccessResponse(null, 'Book restored successfully');
    } finally {
      session.endSession();
    }
  }



  // Publish existing draft book
  async publishBook(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.connection.startSession();

    try {
      let publishedBook: any;

      await session.withTransaction(async () => {
        const book = await this.bookModel.findById(id).session(session);
        
        if (!book) {
          throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
        }

        if (book.isDeleted) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'id', message: 'Book is deleted' }]),
            HttpStatus.BAD_REQUEST,
          );
        }

        if (book.status === BookStatus.ACTIVE) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'status', message: 'Book is already published' }]),
            HttpStatus.BAD_REQUEST,
          );
        }

        // Validate for publish
        // const validation = await this.validateForPublish(book);
        // if (!validation.isValid) {
        //   throw new HttpException(
        //     ErrorResponse.validationError(validation.errors),
        //     HttpStatus.BAD_REQUEST,
        //   );
        // }

        // Update book status to ACTIVE
        book.status = BookStatus.ACTIVE;
        book.publishedAt = new Date();
        
        await book.save({ session });
        publishedBook = book;
      });

      return new SuccessResponse(publishedBook, 'Book published successfully');
    } catch (error) {
      this.logger.error(`Failed to publish book: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        ErrorResponse.badRequest('Failed to publish book'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      session.endSession();
    }
  }
}
