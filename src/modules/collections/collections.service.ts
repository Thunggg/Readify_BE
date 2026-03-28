import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddBooksToCollectionDto } from './dto/add-books-to-collection.dto';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { Book, BookDocument } from '../book/schemas/book.schema';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  // Hàm để chuyển tên collection (ví dụ: "Bộ Sưu Tập Mùa Hè" -> "bo-suu-tap-mua-he")
  private toSlug(input: string): string {
    return (
      input
        .toLowerCase()
        .normalize('NFD') // phân rã kí tự có dấu ra thành kí tự thường + dấu
        .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
        // dấu [] để chỉ tập hợp các kí tự
        // g để thay thế tất cả
        // \u0300-\u036f là khoảng unicode của các dấu tiếng Việt
        // \u0300 là dấu huyền
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        // ^ bên trong [] là không phải => không phải a-z, 0-9, khoảng trắng hoặc dấu gạch ngang
        // s là khoảng trắng
        .trim()
        .replace(/\s+/g, '-')
        // \s là dấu cách, tab, xuống dòng, + là 1 hoặc nhiều dầu liên tiếp
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        // ^ bên ngoài [] là bắt đầu chuỗi, $ là kết thúc chuỗi
        .substring(0, 200)
    );
    // lấy 200 kí tự đầu tiên
  }

  private async ensureBookIdsExist(bookIds: string[]) {
    if (!bookIds.length) return;

    // Tạo một mảng ObjectId từ các bookIds string
    const objectIds = bookIds.map((id) => new Types.ObjectId(id));

    // Đến số lượng sách trong bookModel
    const existingCount = await this.bookModel.countDocuments({
      _id: { $in: objectIds }, //id nằm trong mảng objectIds, $in là in (nằm bên trong)
      isDeleted: { $ne: true }, // $ne not equal => isDeleted = false
    });

    if (existingCount !== objectIds.length) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookIds', message: 'Some bookIds do not exist or are deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Tạo collection mới
  async createCollection(dto: CreateCollectionDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'name', message: 'Collection name cannot be empty' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = this.toSlug(name);
    if (!slug) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'name', message: 'Collection name is invalid for slug generation' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    //Kiểm tra collection có tồn tại hay chưa
    const existing = await this.collectionModel.findOne({
      $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { slug }],
      // $or chỉ cần 1 trong 2 điều kiện đúng: name trùng (không phân biệt hoa thường) hoặc slug trùng
      // 'i' là ignore case (không phân biệt hoa thường)
      // $regex để tìm kiếm theo mẫu, ^ và $ để khớp toàn bộ chuỗi
      isDeleted: { $ne: true },
    });

    if (existing) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'name', message: 'Collection name already exists' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const bookIds = dto.bookIds ?? []; // ?? nếu bookIds là undefined hoặc null thì gán thành mảng rỗng

    const cleanedBookIds: string[] = [];

    for (const id of bookIds) {
      // Bỏ qua nếu không phải string
      if (typeof id !== 'string') continue;

      const trimmed = id.trim();

      // Bỏ qua nếu rỗng
      if (!trimmed) continue;

      // Tránh trùng
      if (!cleanedBookIds.includes(trimmed)) {
        cleanedBookIds.push(trimmed);
      }
    }

    const rawBookIds = cleanedBookIds;

    await this.ensureBookIdsExist(rawBookIds);

    const created = await this.collectionModel.create({
      name,
      slug,
      description: dto.description?.trim(),
      coverImageUrl: dto.coverImageUrl?.trim(),
      bookIds: rawBookIds.map((id) => new Types.ObjectId(id)),
      status: dto.status ?? 1,
      sortOrder: dto.sortOrder ?? 0,
      isDeleted: false,
    });

    const data = await this.collectionModel
      .findById(created._id)
      .select({
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        coverImageUrl: 1,
        bookIds: 1,
        status: 1,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate('bookIds', 'title slug thumbnailUrl status basePrice')
      .lean();

    return new SuccessResponse(data, 'Create collection successfully', 201);
  }

  async getCollectionsList() {
    const items = await this.collectionModel
      .find()
      .select({
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        coverImageUrl: 1,
        status: 1,
        sortOrder: 1,
        isDeleted: 1,
        bookIds: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    const mappedItems = items.map((item) => ({
      ...item,
      totalBooks: item.bookIds?.length ?? 0,
    }));

    return new SuccessResponse(mappedItems, 'Get collections list successfully');
  }

  async getCollectionDetail(collectionId: string) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid collection ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const collection = await this.collectionModel
      .findOne({
        _id: new Types.ObjectId(collectionId),
        isDeleted: { $ne: true },
      })
      .select({
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        coverImageUrl: 1,
        bookIds: 1,
        status: 1,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate('bookIds', 'title slug thumbnailUrl status basePrice soldCount')
      .lean();

    if (!collection) {
      throw new HttpException(ErrorResponse.notFound('Collection not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(collection, 'Get collection detail successfully');
  }

  async updateCollection(collectionId: string, dto: UpdateCollectionDto) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid collection ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const collection = await this.collectionModel.findOne({
      _id: new Types.ObjectId(collectionId),
      isDeleted: { $ne: true },
    });

    if (!collection) {
      throw new HttpException(ErrorResponse.notFound('Collection not found'), HttpStatus.NOT_FOUND);
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'name', message: 'Collection name cannot be empty' }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      const slug = this.toSlug(name);
      if (!slug) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'name', message: 'Collection name is invalid for slug generation' }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      const exists = await this.collectionModel.findOne({
        _id: { $ne: collection._id },
        isDeleted: { $ne: true },
        $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { slug }],
      });

      if (exists) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'name', message: 'Collection name already exists' }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      collection.name = name;
      collection.slug = slug;
    }

    if (dto.description !== undefined) collection.description = dto.description?.trim();
    if (dto.coverImageUrl !== undefined) collection.coverImageUrl = dto.coverImageUrl?.trim();
    if (dto.status !== undefined) collection.status = dto.status;
    if (dto.sortOrder !== undefined) collection.sortOrder = dto.sortOrder;

    if (dto.bookIds !== undefined) {
      const rawBookIds = Array.from(new Set(dto.bookIds.map((id) => id.trim()))).filter(Boolean);
      await this.ensureBookIdsExist(rawBookIds);
      collection.bookIds = rawBookIds.map((id) => new Types.ObjectId(id));
    }

    const saved = await collection.save();

    const data = await this.collectionModel
      .findById(saved._id)
      .select({
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        coverImageUrl: 1,
        bookIds: 1,
        status: 1,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate('bookIds', 'title slug thumbnailUrl status basePrice')
      .lean();

    return new SuccessResponse(data, 'Update collection successfully');
  }

  async deleteCollection(collectionId: string) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid collection ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const collection = await this.collectionModel.findOne({
      _id: new Types.ObjectId(collectionId),
      isDeleted: { $ne: true },
    });

    if (!collection) {
      throw new HttpException(ErrorResponse.notFound('Collection not found'), HttpStatus.NOT_FOUND);
    }

    collection.isDeleted = true;
    collection.deletedAt = new Date();
    await collection.save();

    return new SuccessResponse({ _id: collectionId }, 'Delete collection successfully');
  }

  async addBooksToCollection(collectionId: string, dto: AddBooksToCollectionDto) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid collection ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const collection = await this.collectionModel.findOne({
      _id: new Types.ObjectId(collectionId),
      isDeleted: { $ne: true },
    });

    if (!collection) {
      throw new HttpException(ErrorResponse.notFound('Collection not found'), HttpStatus.NOT_FOUND);
    }

    const bookIds = dto.bookIds ?? [];

    const cleanedBookIds: string[] = [];

    for (const id of bookIds) {
      const trimmed = id.trim();

      // Bỏ qua nếu rỗng
      if (!trimmed) continue;

      // Tránh trùng
      if (!cleanedBookIds.includes(trimmed)) {
        cleanedBookIds.push(trimmed);
      }
    }

    const incomingBookIds = cleanedBookIds;
    await this.ensureBookIdsExist(incomingBookIds);

    const existingBookIds = collection.bookIds ?? [];

    // Tạo Set chứa các bookId đã có trong collection
    const existingIdSet = new Set<string>(); // Dùng Set bởi vì Set không cho phép các phần tử nằm trong nó bị trùng lặp
    for (const id of existingBookIds) {
      existingIdSet.add(String(id));
    }

    // Chỉ lấy các bookId chưa tồn tại trong collection
    const toAddBookIds: string[] = [];
    for (const id of incomingBookIds) {
      if (!existingIdSet.has(id)) { // .has để kiểm tra xem Set đã có phần tử đó chưa
        toAddBookIds.push(id);
      }
    }

    if (toAddBookIds.length > 0) {
      const currentBookIds = collection.bookIds ?? [];
      const newBookObjectIds = toAddBookIds.map((id) => new Types.ObjectId(id));

      collection.bookIds = [...currentBookIds, ...newBookObjectIds];
      await collection.save();
    }

    const data = await this.collectionModel
      .findById(collection._id)
      .select({
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        coverImageUrl: 1,
        bookIds: 1,
        status: 1,
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate('bookIds', 'title slug thumbnailUrl status basePrice soldCount')
      .lean();

    return new SuccessResponse(
      {
        ...data,
        addedCount: toAddBookIds.length,
      },
      'Add books to collection successfully',
    );
  }
}
