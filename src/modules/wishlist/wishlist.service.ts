import { Injectable, BadRequestException, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Stock, StockDocument } from '../stock/schemas/stock.schema';

import { SuccessResponse } from '../../shared/responses/success.response';
import { ErrorResponse } from '../../shared/responses/error.response';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private readonly wishlistModel: Model<WishlistDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
  ) {}

  async addToWishlist(userId: string, addToWishlistDto: AddToWishlistDto) {
    const { bookId } = addToWishlistDto;

    // Kiểm tra id có đúng format ObjectId của MongoDB không
    // ObjectId có 24 ký tự hex (0-9, a-f)
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId/bookId', message: 'Invalid userId or bookId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra sách có tồn tại trong database không
    // exists() trả về true/false, nhanh hơn findOne()
    const bookExists = await this.bookModel.exists({ _id: bookId });
    if (!bookExists) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra sách đã có trong wishlist chưa
    const existingItem = await this.wishlistModel.exists({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (existingItem) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookId', message: 'Book already in wishlist' }]),
        HttpStatus.CONFLICT,
      );
    }

    try {
      // Tạo wishlist item mới
      const created = await this.wishlistModel.create({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      });

      const data = {
        _id: (created as any)._id,
        userId: (created as any).userId,
        bookId: (created as any).bookId,
        createdAt: (created as any).createdAt,
        updatedAt: (created as any).updatedAt,
      };

      return new SuccessResponse(data, 'Successfully added to wishlist');
    } catch (error) {
      // Xử lý lỗi duplicate key (MongoDB error code 11000)
      // Có thể xảy ra nếu 2 request cùng lúc thêm cùng 1 sách
      if (error.code === 11000) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'bookId', message: 'Book already in wishlist' }]),
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        new ErrorResponse('Failed to add to wishlist', 'INTERNAL_ERROR', 500),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getWishlistByUserId(userId: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid userId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // QUERY - Lấy danh sách wishlist và populate thông tin sách
    // lean() để trả về plain JavaScript object thay vì Mongoose document => nhanh hơn
    // sort({ createdAt: -1 }) để sắp xếp mới nhất trước
    const wishlistItems = await this.wishlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'bookId',
        select: 'title author price discount coverImage description isbn',
      })
      .sort({ createdAt: -1, _id: 1 }) // Sắp xếp phụ theo _id để đảm bảo thứ tự ổn định
      .lean();

    return new SuccessResponse(wishlistItems, 'Successfully retrieved wishlist');
  }

  async getWishlistItemCount(userId: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid userId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // countDocuments() nhanh hơn find().length vì chỉ đếm, không load data
    const count = await this.wishlistModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return new SuccessResponse({ count }, 'Successfully retrieved wishlist count');
  }

  async checkBookInWishlist(userId: string, bookId: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId/bookId', message: 'Invalid userId or bookId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // exists() trả về true/false, nhanh hơn findOne()
    const exists = await this.wishlistModel.exists({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    return new SuccessResponse({ isInWishlist: !!exists }, 'Successfully checked wishlist');
  }

  async removeFromWishlist(userId: string, bookId: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId/bookId', message: 'Invalid userId or bookId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // findOneAndDelete() tìm và xóa trong 1 query, hiệu quả hơn findOne + delete
    const result = await this.wishlistModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (!result) {
      throw new HttpException(ErrorResponse.notFound('Wishlist item not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse({ _id: result._id }, 'Successfully removed from wishlist');
  }

  async clearWishlist(userId: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid userId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // deleteMany() xóa tất cả document thỏa điều kiện
    const result = await this.wishlistModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return new SuccessResponse({ deletedCount: result.deletedCount }, 'Successfully cleared wishlist');
  }

  async moveToCart(userId: string, bookId: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId/bookId', message: 'Invalid userId or bookId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Tìm item trong wishlist
    const wishlistItem = await this.wishlistModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (!wishlistItem) {
      throw new HttpException(ErrorResponse.notFound('Wishlist item not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra stock availability
    const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookId) });
    if (!stock) {
      throw new HttpException(ErrorResponse.notFound('Book not found in stock'), HttpStatus.NOT_FOUND);
    }

    if (stock.quantity < 1) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'stock', message: 'Book is out of stock' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra xem sách đã có trong cart chưa
    const existingCartItem = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    try {
      if (existingCartItem) {
        // Nếu đã có trong cart, tăng quantity
        const newQuantity = existingCartItem.quantity + 1;

        if (newQuantity > stock.quantity) {
          throw new HttpException(
            ErrorResponse.validationError([
              {
                field: 'quantity',
                message: `Not enough stock. Available: ${stock.quantity}, In cart: ${existingCartItem.quantity}`,
              },
            ]),
            HttpStatus.BAD_REQUEST,
          );
        }

        existingCartItem.quantity = newQuantity;
        await existingCartItem.save();
      } else {
        // Nếu chưa có trong cart, tạo mới
        await this.cartModel.create({
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
          quantity: 1,
        });
      }

      // Xóa khỏi wishlist sau khi thêm vào cart thành công
      await this.wishlistModel.findByIdAndDelete(wishlistItem._id);

      return new SuccessResponse(null, 'Successfully moved to cart');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        new ErrorResponse('Failed to move to cart', 'INTERNAL_ERROR', 500),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async bulkMoveToCart(userId: string, bookIds: string[]) {
    // Kiểm tra userId có đúng format ObjectId không
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid userId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra tất cả bookIds có hợp lệ không
    const invalidIds = bookIds.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookIds', message: 'Invalid book IDs found' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Định nghĩa type rõ ràng cho results
    const results: {
      success: string[];
      failed: Array<{ bookId: string; reason: string }>;
    } = {
      success: [],
      failed: [],
    };

    // Xử lý từng sách
    for (const bookId of bookIds) {
      try {
        // Kiểm tra sách có trong wishlist không
        const wishlistItem = await this.wishlistModel.findOne({
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
        });

        if (!wishlistItem) {
          results.failed.push({ bookId, reason: 'Not in wishlist' });
          continue;
        }

        // Kiểm tra stock
        const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookId) });
        if (!stock || stock.quantity < 1) {
          results.failed.push({ bookId, reason: 'Book is out of stock' });
          continue;
        }

        // Kiểm tra xem đã có trong cart chưa
        const existingCartItem = await this.cartModel.findOne({
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
        });

        if (existingCartItem) {
          // Tăng quantity nếu đã có
          const newQuantity = existingCartItem.quantity + 1;
          if (newQuantity > stock.quantity) {
            results.failed.push({ bookId, reason: 'Not enough stock' });
            continue;
          }
          existingCartItem.quantity = newQuantity;
          await existingCartItem.save();
        } else {
          // Tạo mới nếu chưa có
          await this.cartModel.create({
            userId: new Types.ObjectId(userId),
            bookId: new Types.ObjectId(bookId),
            quantity: 1,
          });
        }

        // Xóa khỏi wishlist
        await this.wishlistModel.findByIdAndDelete(wishlistItem._id);
        results.success.push(bookId);
      } catch (error) {
        results.failed.push({ bookId, reason: 'Processing error' });
      }
    }

    return new SuccessResponse(results, 'Bulk move to cart completed');
  }

  async bulkRemove(userId: string, bookIds: string[]) {
    // Kiểm tra userId có đúng format ObjectId không
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid userId' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra tất cả bookIds có hợp lệ không
    const invalidIds = bookIds.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'bookIds', message: 'Invalid book IDs found' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Xóa tất cả các sách được chọn
    const result = await this.wishlistModel.deleteMany({
      userId: new Types.ObjectId(userId),
      bookId: { $in: bookIds.map((id) => new Types.ObjectId(id)) },
    });

    return new SuccessResponse(
      { deletedCount: result.deletedCount, requestedCount: bookIds.length },
      'Successfully removed selected items from wishlist',
    );
  }
}
