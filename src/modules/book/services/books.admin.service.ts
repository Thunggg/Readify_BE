import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';
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

@Injectable()
export class BooksAdminService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Supplier.name) private readonly supplierModel: Model<Supplier>,
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

    // Validate publisher (supplier) exists and is not deleted
    const publisher = await this.supplierModel
      .findById(dto.publisherId)
      .select({ _id: 1, isDeleted: 1 })
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

    if (dto.basePrice === undefined || dto.basePrice === null) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'basePrice', message: 'basePrice is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check for duplicate categoryIds
    const uniqueCategoryIds = [...new Set(dto.categoryIds)];
    if (uniqueCategoryIds.length !== dto.categoryIds.length) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'categoryIds', message: 'Duplicate categoryIds detected' }]),
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

    // Validate categories exist and are not deleted
    const categories = await this.categoryModel
      .find({ _id: { $in: categoryIds } })
      .select({ _id: 1, isDeleted: 1 })
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

        if (medias.length !== allMediaIds.length) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'mediaIds', message: 'One or more media not found' }]),
            HttpStatus.BAD_REQUEST,
          );
        }

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
          currency: dto.currency?.trim() || 'VND',
          thumbnailUrl: cover.url,
          status: dto.status ?? 1,
          tags: dto.tags ?? [],
          isDeleted: false,
          soldCount: 0,
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
              // attachedTo: { model: 'Book', id: book._id },
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

      return new SuccessResponse(createdBook, 'Book created successfully');
    } finally {
      session.endSession();
    }
  }

  async updateBook(id: string, dto: UpdateBookDto, staffId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.connection.startSession();

    try {
      let updatedBook: Book | null = null;

      await session.withTransaction(async () => {
        // ===== 1) Load book (NO lean) =====
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

        // ===== 2) Update basic fields =====
        if (dto.title?.trim()) book.title = dto.title.trim();
        if (dto.subtitle !== undefined) book.subtitle = dto.subtitle?.trim();
        if (dto.description !== undefined) book.description = dto.description?.trim();
        if (dto.authors !== undefined) book.authors = dto.authors;
        if (dto.language !== undefined) book.language = dto.language?.trim();
        if (dto.publishDate !== undefined) book.publishDate = dto.publishDate;
        if (dto.pageCount !== undefined) book.pageCount = dto.pageCount;
        if (dto.basePrice !== undefined) book.basePrice = dto.basePrice;
        if (dto.currency !== undefined) book.currency = dto.currency?.trim() || 'VND';
        if (dto.status !== undefined) book.status = dto.status;
        if (dto.tags !== undefined) book.tags = dto.tags;

        // ===== 3) Slug handling =====
        if (dto.slug?.trim() || dto.title?.trim()) {
          const slugSource = dto.slug?.trim() || dto.title!.trim();
          const slug = slugSource
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');

          if (!slug) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'slug', message: 'Cannot generate slug' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          if (slug !== book.slug) {
            const exists = await this.bookModel.exists({
              slug,
              isDeleted: false,
              _id: { $ne: book._id },
            });
            if (exists) {
              throw new HttpException(
                ErrorResponse.validationError([{ field: 'slug', message: 'Slug already exists' }]),
                HttpStatus.BAD_REQUEST,
              );
            }
            book.slug = slug;
          }
        }

        // ===== 3.1) Validate categoryIds if provided =====
        if (dto.categoryIds !== undefined) {
          if (!dto.categoryIds?.length) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'categoryIds', message: 'categoryIds cannot be empty' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          // Check for duplicate categoryIds
          const uniqueCategoryIds = [...new Set(dto.categoryIds)];
          if (uniqueCategoryIds.length !== dto.categoryIds.length) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'categoryIds', message: 'Duplicate categoryIds detected' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          const categoryIds = dto.categoryIds.map((id) => {
            if (!Types.ObjectId.isValid(id)) {
              throw new HttpException(
                ErrorResponse.validationError([{ field: 'categoryIds', message: `Invalid categoryId: ${id}` }]),
                HttpStatus.BAD_REQUEST,
              );
            }
            return new Types.ObjectId(id);
          });

          // Validate categories exist and are not deleted
          const categories = await this.categoryModel
            .find({ _id: { $in: categoryIds } })
            .select({ _id: 1, isDeleted: 1 })
            .session(session)
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

          book.categoryIds = categoryIds;
        }

        // ===== 3.2) Validate publisherId if provided =====
        if (dto.publisherId !== undefined) {
          if (!Types.ObjectId.isValid(dto.publisherId)) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'publisherId', message: 'Invalid publisherId' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          // Validate publisher (supplier) exists and is not deleted
          const publisher = await this.supplierModel
            .findById(dto.publisherId)
            .select({ _id: 1, isDeleted: 1 })
            .session(session)
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

          book.publisherId = new Types.ObjectId(dto.publisherId);
        }

        // ===== 4) MEDIA =====
        let currentImages = [...(book.images || [])];
        const attachIds = new Set<string>();
        const detachIds = new Set<string>();

        // 4a) Remove images
        if (dto.removeMediaIds?.length) {
          const removeIds = dto.removeMediaIds.map((id) => {
            if (!Types.ObjectId.isValid(id)) {
              throw new HttpException(
                ErrorResponse.validationError([{ field: 'removeMediaIds', message: `Invalid mediaId: ${id}` }]),
                HttpStatus.BAD_REQUEST,
              );
            }
            return String(id);
          });

          currentImages = currentImages.filter((img) => {
            const shouldRemove = removeIds.includes(String(img.mediaId));
            if (shouldRemove) detachIds.add(String(img.mediaId));
            return !shouldRemove;
          });
        }

        // 4b) Replace cover
        if (dto.coverMediaId) {
          if (!Types.ObjectId.isValid(dto.coverMediaId)) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'coverMediaId', message: 'Invalid coverMediaId' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          const newCover = await this.mediaModel
            .findById(dto.coverMediaId)
            .select({ _id: 1, url: 1, status: 1, uploadedBy: 1 })
            .session(session);

          if (!newCover || newCover.status !== MediaStatus.TEMP) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'coverMediaId', message: 'Cover media is invalid' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          if (staffId && String(newCover.uploadedBy) !== staffId) {
            throw new HttpException(ErrorResponse.forbidden('You do not own this media'), HttpStatus.FORBIDDEN);
          }

          const oldCover = currentImages.find((img) => img.kind === 'cover');
          if (oldCover) detachIds.add(String(oldCover.mediaId));

          currentImages = currentImages.filter((img) => img.kind !== 'cover');
          currentImages.unshift({ kind: 'cover', mediaId: newCover._id, url: newCover.url });

          attachIds.add(String(newCover._id));
          book.thumbnailUrl = newCover.url;
        }

        // 4c) Add gallery
        if (dto.addGalleryMediaIds?.length) {
          const addIds = dto.addGalleryMediaIds.map((id) => {
            if (!Types.ObjectId.isValid(id)) {
              throw new HttpException(
                ErrorResponse.validationError([{ field: 'addGalleryMediaIds', message: `Invalid mediaId: ${id}` }]),
                HttpStatus.BAD_REQUEST,
              );
            }
            return new Types.ObjectId(id);
          });

          const medias = await this.mediaModel
            .find({ _id: { $in: addIds } })
            .select({ _id: 1, url: 1, status: 1, uploadedBy: 1 })
            .session(session);

          if (medias.length !== addIds.length || medias.some((m) => m.status !== MediaStatus.TEMP)) {
            throw new HttpException(
              ErrorResponse.validationError([{ field: 'addGalleryMediaIds', message: 'Invalid gallery media' }]),
              HttpStatus.BAD_REQUEST,
            );
          }

          const existed = new Set(currentImages.map((i) => String(i.mediaId)));

          for (const m of medias) {
            if (staffId && String(m.uploadedBy) !== staffId) {
              throw new HttpException(ErrorResponse.forbidden('You do not own this media'), HttpStatus.FORBIDDEN);
            }
            if (!existed.has(String(m._id))) {
              currentImages.push({ kind: 'gallery', mediaId: m._id, url: m.url });
              attachIds.add(String(m._id));
            }
          }
        }

        book.images = currentImages;
        await book.save({ session });
        updatedBook = book;

        // ===== 5) Update Media states =====
        if (attachIds.size) {
          await this.mediaModel.updateMany(
            { _id: { $in: [...attachIds].map((id) => new Types.ObjectId(id)) }, status: 'TEMP' },
            { $set: { status: 'ATTACHED', attachedTo: { model: 'Book', id: book._id } } },
            { session },
          );
        }

        if (detachIds.size) {
          await this.mediaModel.updateMany(
            { _id: { $in: [...detachIds].map((id) => new Types.ObjectId(id)) }, 'attachedTo.id': book._id },
            { $set: { status: 'TEMP' }, $unset: { attachedTo: 1 } },
            { session },
          );
        }
      });

      return new SuccessResponse(updatedBook, 'Book updated successfully');
    } finally {
      session.endSession();
    }
  }

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
            $unset: { deletedAt: 1}
          },
          { session }
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
}
