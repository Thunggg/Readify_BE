import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book } from '../schemas/book.schema';
import { SearchPublicBooksDto } from '../dto/search-public-books.dto';
import { ErrorResponse } from '../../../shared/responses/error.response';
import { SortOrder } from 'mongoose';
import { SearchBookSuggestionsDto } from '../dto/search-book-suggestions.dto';
import { PaginatedResponse } from '../../../shared/responses/paginated.response';
import { SuccessResponse } from '../../../shared/responses/success.response';

// Service cung cấp các API công khai cho sách (không yêu cầu xác thực)
@Injectable()
export class BooksPublicService {
  constructor(@InjectModel(Book.name) private readonly bookModel: Model<Book>) {}

  // Lấy danh sách sách công khai với phân trang, lọc và sắp xếp
  async getBooksList(query: SearchPublicBooksDto) {
    // Thiết lập phân trang: trang mặc định 1, giới hạn tối đa 50, tối thiểu 12
    // ===== pagination =====
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 12, 50);
    const skip = (page - 1) * limit;

    // Bộ lọc cơ bản: chỉ lấy sách chưa xóa và có trạng thái active (status = 1)
    // ===== base filter (public) =====
    const filter: Record<string, any> = {
      isDeleted: false,
      status: 1,
    };

    // Lọc theo danh mục nếu có categoryId, kiểm tra tính hợp lệ của ObjectId
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

    // Lọc theo khoảng giá nếu có minPrice hoặc maxPrice
    // ===== price filter =====
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.basePrice = {};
      if (query.minPrice !== undefined) filter.basePrice.$gte = query.minPrice; // Giá >= minPrice
      if (query.maxPrice !== undefined) filter.basePrice.$lte = query.maxPrice; // Giá <= maxPrice
    }

    // Tìm kiếm theo từ khóa trong title, slug, hoặc isbn (không phân biệt hoa thường)
    // ===== search =====
    const keyword = query.q?.trim(); // Lấy từ khóa từ query.q và loại bỏ khoảng trắng đầu/cuối
    if (keyword) { // Chỉ tìm kiếm nếu từ khóa không rỗng
      filter.$or = [ // Sử dụng $or để tìm kiếm trong ít nhất một trường
        { title: { $regex: keyword, $options: 'i' } }, // Tìm trong title với regex không phân biệt hoa thường
        { slug: { $regex: keyword, $options: 'i' } }, // Tìm trong slug
        { isbn: { $regex: keyword, $options: 'i' } }, // Tìm trong isbn
      ];
    }

    // Map các tùy chọn sắp xếp với hướng tương ứng
    // ===== sort =====
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 }, // Mới nhất
      oldest: { createdAt: 1 }, // Cũ nhất
      price_asc: { basePrice: 1, createdAt: -1 }, // Giá tăng dần, sau đó createdAt giảm dần
      price_desc: { basePrice: -1, createdAt: -1 }, // Giá giảm dần
      best_selling: { soldCount: -1, createdAt: -1 }, // Bán chạy nhất
    };

    const sort = sortMap[query.sort ?? 'newest'] || sortMap.newest;

    // Thực hiện truy vấn song song: lấy danh sách sách và tổng số
    // ===== query =====
    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter) // Áp dụng bộ lọc
        .select({ // Chỉ chọn các trường cần thiết để tối ưu hiệu suất
          title: 1,
          slug: 1,
          authors: 1,
          thumbnailUrl: 1,
          basePrice: 1,
          currency: 1,
          soldCount: 1,
          categoryIds: 1,
          createdAt: 1,
        })
        .populate('authors', 'name slug') // Populate thông tin tác giả
        .sort(sort) // Sắp xếp theo tùy chọn
        .skip(skip) // Bỏ qua số bản ghi để phân trang
        .limit(limit) // Giới hạn số bản ghi trả về
        .lean(), // Trả về plain object để tăng hiệu suất
      this.bookModel.countDocuments(filter), // Đếm tổng số bản ghi phù hợp
    ]);

    // Trả về response phân trang
    return new PaginatedResponse(items, { page, limit, total }, 'Get books list successfully');
  }

  // Lấy gợi ý sách dựa trên từ khóa tìm kiếm (để autocomplete)
  async getBookSuggestions(query: SearchBookSuggestionsDto) {
    // Chuẩn hóa từ khóa và giới hạn số kết quả (tối đa 10, mặc định 6)
    const keyword = query.q?.trim();
    const limit = Math.min(query.limit ?? 6, 10);

    // (Tùy chọn) Không tìm kiếm nếu từ khóa quá ngắn (< 2 ký tự)
    // if (!keyword || keyword.length < 2) {
    //   return ApiResponse.success({ items: [] }, 'Get book suggestions successfully');
    // }

    // Truy vấn sách phù hợp: tìm trong title hoặc slug, sắp xếp theo soldCount giảm dần
    const items = await this.bookModel
      .find({
        isDeleted: false, // Chỉ sách chưa xóa
        status: 1, // Chỉ sách active
        $or: [
          { title: { $regex: keyword, $options: 'i' } }, // Tìm trong title
          { slug: { $regex: keyword, $options: 'i' } }, // Tìm trong slug
        ],
      })
      .select({ // Chọn các trường cần thiết
        title: 1,
        slug: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        authors: 1,
      })
      .populate('authors', 'name slug') // Populate tác giả
      .sort({ soldCount: -1 }) // Sắp xếp theo số lượng bán giảm dần (ưu tiên sách bán chạy)
      .limit(limit) // Giới hạn số kết quả
      .lean(); // Tăng hiệu suất

    // Trả về danh sách gợi ý
    return new SuccessResponse(items, 'Get book suggestions successfully');
  }

  // Lấy chi tiết sách theo ID
  async getBookDetailById(id: string) {
    // Kiểm tra tính hợp lệ của ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Truy vấn sách theo ID, chỉ lấy sách chưa xóa và active
    const book = await this.bookModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false, status: 1 })
      .select({ // Chọn các trường chi tiết của sách
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
        currency: 1,
        soldCount: 1,
        createdAt: 1,
      })
      .populate('authors', 'name slug') // Populate tác giả
      .populate('publisherId', 'name') // Populate nhà xuất bản
      .populate('categoryIds', 'name slug') // Populate danh mục
      .lean(); // Tăng hiệu suất

    // Nếu không tìm thấy sách, trả về lỗi 404
    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // Trả về chi tiết sách
    return new SuccessResponse(book, 'Get book detail successfully');
  }

  // Lấy chi tiết sách theo slug (URL-friendly identifier)
  async getBookDetailBySlug(slug: string) {
    // Chuẩn hóa slug: loại bỏ khoảng trắng và chuyển về lowercase
    const s = slug?.trim().toLowerCase();
    if (!s) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Truy vấn sách theo slug, chỉ lấy sách chưa xóa và active
    const book = await this.bookModel
      .findOne({ slug: s, isDeleted: false, status: 1 })
      .select({ // Chọn các trường chi tiết, bao gồm tags
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
        currency: 1,
        soldCount: 1,
        createdAt: 1,
        tags: 1, // Bao gồm tags (không có trong method theo ID)
      })
      .populate('authors', 'name slug') // Populate tác giả
      .populate('categoryIds', 'name slug') // Populate danh mục
      .populate('publisherId', 'name') // Populate nhà xuất bản
      .populate('images', 'url') // Populate hình ảnh (chỉ URL)
      .lean(); // Tăng hiệu suất

    // Nếu không tìm thấy sách, trả về lỗi 404
    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // Trả về chi tiết sách
    return new SuccessResponse(book, 'Get book detail successfully');
  }

  // Lấy danh sách sách liên quan dựa trên ID sách hiện tại (dựa trên category và authors)
  async getRelatedBooks(bookId: string, limitParam?: string) {
    // Kiểm tra tính hợp lệ của ObjectId
    if (!Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid book id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Xác định giới hạn số sách liên quan (từ 1 đến 20, mặc định 8)
    const limit = Math.min(Math.max(parseInt(limitParam ?? '8', 10) || 8, 1), 20);

    // Tải thông tin sách hiện tại để lấy categoryIds và authors
    const book = await this.bookModel
      .findOne({ _id: new Types.ObjectId(bookId), isDeleted: false, status: 1 })
      .select({ categoryIds: 1, authors: 1 })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // Chuẩn hóa danh sách categoryIds và authors
    const categoryIds = (book.categoryIds ?? []).map((id: any) => new Types.ObjectId(String(id)));
    const authors = (book.authors ?? []).map((a: any) => String(a).trim()).filter(Boolean);

    // Xây dựng bộ lọc cho sách liên quan
    const filter: Record<string, any> = {
      _id: { $ne: new Types.ObjectId(bookId) }, // Loại trừ sách hiện tại
      isDeleted: false,
      status: 1,
    };

    // Tạo điều kiện OR: sách cùng category hoặc cùng authors
    const or: any[] = [];
    if (categoryIds.length > 0) or.push({ categoryIds: { $in: categoryIds } });
    if (authors.length > 0) or.push({ authors: { $in: authors } });

    // Nếu có điều kiện, thêm vào filter; nếu không, sẽ lấy sách mới nhất (fallback)
    if (or.length > 0) filter.$or = or;

    // Truy vấn sách liên quan
    const items = await this.bookModel
      .find(filter)
      .select({ // Chọn các trường cần thiết
        title: 1,
        slug: 1,
        authors: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        currency: 1,
        soldCount: 1,
        categoryIds: 1,
        createdAt: 1,
      })
      .populate('authors', 'name slug') // Populate tác giả
      .sort({ soldCount: -1, createdAt: -1 }) // Sắp xếp: ưu tiên bán chạy, sau đó mới nhất
      .limit(limit)
      .lean();

    // Trả về danh sách sách liên quan
    return new SuccessResponse({ items }, 'Get related books successfully');
  }

  // Lấy danh sách sách liên quan dựa trên slug sách hiện tại (tương tự getRelatedBooks nhưng dùng slug)
  async getRelatedBookBySlug(bookSlug: string, limitParam?: string) {
    // Chuẩn hóa slug
    const slug = bookSlug?.trim().toLowerCase();
    if (!slug) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'slug', message: 'Slug is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Xác định giới hạn số sách liên quan
    const limit = Math.min(Math.max(parseInt(limitParam ?? '8', 10) || 8, 1), 20);

    // Tải thông tin sách hiện tại theo slug
    const book = await this.bookModel
      .findOne({ slug, isDeleted: false, status: 1 })
      .select({ _id: 1, categoryIds: 1, authors: 1 })
      .lean();

    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // Chuẩn hóa danh sách categoryIds và authors
    const categoryIds = (book.categoryIds ?? []).map((id: any) => new Types.ObjectId(String(id)));
    const authors = (book.authors ?? []).map((a: any) => String(a).trim()).filter(Boolean);

    // Xây dựng bộ lọc cho sách liên quan
    const filter: Record<string, any> = {
      _id: { $ne: book._id }, // Loại trừ sách hiện tại
      isDeleted: false,
      status: 1,
    };

    // Tạo điều kiện OR: sách cùng category hoặc cùng authors
    const or: any[] = [];
    if (categoryIds.length) or.push({ categoryIds: { $in: categoryIds } });
    if (authors.length) or.push({ authors: { $in: authors } });

    // Nếu có điều kiện, thêm vào filter
    if (or.length) filter.$or = or;

    // Truy vấn sách liên quan
    const items = await this.bookModel
      .find(filter)
      .select({ // Chọn các trường cần thiết
        title: 1,
        slug: 1,
        authors: 1,
        thumbnailUrl: 1,
        basePrice: 1,
        currency: 1,
        soldCount: 1,
        categoryIds: 1,
        createdAt: 1,
      })
      .populate('authors', 'name slug') // Populate tác giả
      .sort({ soldCount: -1, createdAt: -1 }) // Sắp xếp: ưu tiên bán chạy, sau đó mới nhất
      .limit(limit)
      .lean();

    // Trả về danh sách sách liên quan
    return new SuccessResponse(items, 'Get related books successfully');
  }
}
