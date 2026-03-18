import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Stock, StockDocument } from '../stock/schemas/stock.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { ErrorResponse } from '../../shared/responses/error.response';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class CartService {
  // Constructor: hàm khởi tạo của class, tự động chạy khi tạo instance của CartService
  constructor(
    // Inject các Model từ Mongoose để tương tác với database
    // cartModel: để thao tác với collection 'carts' trong MongoDB
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    // stockModel: để kiểm tra số lượng sách còn trong kho
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    // bookModel: để lấy thông tin chi tiết của sách
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  /**
   * CHỨC NĂNG: Thêm sách vào giỏ hàng
   * @param userId - ID của người dùng
   * @param addToCartDto - Dữ liệu chứa bookId và quantity (số lượng)
   * @returns Promise với kết quả thêm sách vào giỏ hàng
   */
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    // Destructuring: lấy bookId và quantity từ object addToCartDto
    // Nếu quantity không có giá trị, mặc định là 1
    const { bookId, quantity = 1 } = addToCartDto;

    // BƯỚC 1: Kiểm tra định dạng ObjectId có hợp lệ không
    // ObjectId là định dạng ID đặc biệt của MongoDB (24 ký tự hex)
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // BƯỚC 2: Kiểm tra xem sách có tồn tại trong database không
    // await: chờ kết quả từ database trước khi tiếp tục
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      // Nếu không tìm thấy sách, throw exception để dừng hàm và trả lỗi
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // BƯỚC 3: Kiểm tra tồn kho (stock) của sách
    // Tìm record stock có bookId tương ứng
    const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookId) });
    if (!stock) {
      throw new HttpException(ErrorResponse.notFound('Book not found in stock'), HttpStatus.NOT_FOUND);
    }

    try {
      // BƯỚC 4: Kiểm tra xem sách này đã có trong giỏ hàng của user chưa
      // findOne: tìm một document thỏa mãn điều kiện (userId và bookId)
      const existingItem = await this.cartModel.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      });

      if (existingItem) {
        // TRƯỜNG HỢP 1: Sách đã có trong giỏ hàng
        // => Cộng thêm số lượng vào số lượng hiện tại
        const newQuantity = existingItem.quantity + quantity;
        
        // Kiểm tra tổng số lượng mới có vượt quá tồn kho không
        if (newQuantity > stock.quantity) {
          throw new HttpException(
            ErrorResponse.badRequest(`Not enough stock. Available: ${stock.quantity}, Requested: ${newQuantity}`),
            HttpStatus.BAD_REQUEST,
          );
        }
        
        // Cập nhật số lượng mới
        existingItem.quantity = newQuantity;
        // save(): lưu thay đổi vào database
        const updated = await existingItem.save();
        // Trả về response thành công với dữ liệu đã update
        return new SuccessResponse(updated, 'Item quantity updated in cart successfully');
      }

      // TRƯỜNG HỢP 2: Sách chưa có trong giỏ hàng
      // Kiểm tra số lượng yêu cầu có vượt quá tồn kho không
      if (quantity > stock.quantity) {
        throw new HttpException(
          ErrorResponse.badRequest(`Not enough stock. Available: ${stock.quantity}, Requested: ${quantity}`),
          HttpStatus.BAD_REQUEST,
        );
      }

      // Tạo một cart item mới
      // new this.cartModel(): tạo instance mới của Cart model
      const newCartItem = new this.cartModel({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        quantity,
      });

      // Lưu cart item mới vào database
      const created = await newCartItem.save();
      return new SuccessResponse(created, 'Item added to cart successfully');
    } catch (error) {
      // Xử lý lỗi duplicate key (error code 11000)
      // Xảy ra khi cố gắng thêm sách đã tồn tại (do unique constraint)
      if (error.code === 11000) {
        throw new HttpException(ErrorResponse.badRequest('Book already exists in cart'), HttpStatus.BAD_REQUEST);
      }
      // Nếu là lỗi khác, throw lại để xử lý ở layer cao hơn
      throw error;
    }
  }

  /**
   * CHỨC NĂNG: Cập nhật số lượng của một sách trong giỏ hàng
   * @param userId - ID của người dùng
   * @param updateCartItemDto - Dữ liệu chứa bookId và quantity mới
   * @returns Promise với kết quả cập nhật
   */
  async updateQuantity(userId: string, updateCartItemDto: UpdateCartItemDto) {
    const { bookId, quantity } = updateCartItemDto;

    // BƯỚC 1: Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // BƯỚC 2: Tìm cart item cần update trong database
    const cartItem = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    // Nếu không tìm thấy, trả về lỗi
    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    // BƯỚC 3: Validate số lượng phải >= 1
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    // BƯỚC 4: Kiểm tra tồn kho
    const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookId) });
    if (!stock) {
      throw new HttpException(ErrorResponse.notFound('Book not found in stock'), HttpStatus.NOT_FOUND);
    }

    // BƯỚC 5: Kiểm tra số lượng mới có vượt quá tồn kho không
    if (quantity > stock.quantity) {
      throw new HttpException(
        ErrorResponse.badRequest(`Not enough stock. Available: ${stock.quantity}, Requested: ${quantity}`),
        HttpStatus.BAD_REQUEST,
      );
    }

    // BƯỚC 6: Cập nhật số lượng mới và lưu vào database
    cartItem.quantity = quantity;
    const updated = await cartItem.save();
    return new SuccessResponse(updated, 'Cart item updated successfully');
  }

  /**
   * CHỨC NĂNG: Xóa một sách khỏi giỏ hàng
   * @param userId - ID của người dùng
   * @param bookId - ID của sách cần xóa
   * @returns Promise với kết quả xóa
   */
  async removeFromCart(userId: string, bookId: string) {
    // BƯỚC 1: Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // BƯỚC 2: Xóa cart item khỏi database
    // deleteOne(): xóa một document thỏa mãn điều kiện
    const result = await this.cartModel.deleteOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    // BƯỚC 3: Kiểm tra xem có xóa được gì không
    // deletedCount: số lượng document đã xóa (0 hoặc 1)
    if (result.deletedCount === 0) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(null, 'Item removed from cart successfully');
  }

  /**
   * CHỨC NĂNG: Lấy toàn bộ giỏ hàng của một user
   * @param userId - ID của người dùng
   * @returns Promise với danh sách cart items và thông tin validation
   */
  async getCartByUserId(userId: string) {
    // BƯỚC 1: Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // BƯỚC 2: Validate và tự động cập nhật số lượng trong cart dựa trên stock hiện tại
    // Đảm bảo số lượng trong cart không vượt quá tồn kho
    const validationResult = await this.validateCartStock(userId);

    // BƯỚC 3: Lấy lại cart items sau khi đã validate và update
    const cartItems = await this.cartModel
      .find({ userId: new Types.ObjectId(userId) }) // Tìm tất cả items của user
      .populate('bookId', 'title authors isbn coverUrl thumbnailUrl basePrice pages publisher description categories publishedDate') // populate: thay thế bookId bằng thông tin chi tiết của book
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo, mới nhất trước
      .lean() // Chuyển từ Mongoose document sang plain JavaScript object (tăng performance)
      .exec(); // Thực thi query

    // BƯỚC 4: Transform dữ liệu để phù hợp với format frontend mong đợi
    // Promise.all: chạy song song tất cả các promise, chờ tất cả hoàn thành
    const transformedItems = await Promise.all(
      cartItems.map(async (item) => {
        // Chuyển bookId từ ObjectId sang string
        const bookIdStr: string = (item.bookId as any)._id?.toString() || item.bookId.toString();
        
        // Lấy thông tin stock (tồn kho) cho sách này
        const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookIdStr) }).lean().exec();
        
        // Trả về object mới với:
        // - Spread operator (...item): copy tất cả properties của item
        // - bookId dạng string
        // - book: object chứa thông tin chi tiết sách (nếu đã populate)
        // - stock: thông tin tồn kho (quantity, price, status)
        return {
          ...item,
          bookId: bookIdStr,
          book: typeof item.bookId === 'object' && item.bookId !== null ? item.bookId : undefined,
          stock: stock
            ? {
                quantity: stock.quantity,
                price: stock.price,
                status: stock.status,
              }
            : undefined,
        };
      })
    );

    return new SuccessResponse(
      {
        items: transformedItems,
        validation: {
          updated: validationResult.updated,
          removed: validationResult.removed,
          warnings: validationResult.warnings,
        },
      },
      'Cart retrieved successfully',
    );
  }

  /**
   * CHỨC NĂNG: Validate số lượng trong cart so với stock hiện tại
   * Tự động cập nhật hoặc xóa items nếu stock không đủ
   * @param userId - ID của người dùng
   * @returns Object chứa danh sách items đã update, removed và warnings
   */
  async validateCartStock(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // Lấy tất cả cart items của user
    const cartItems = await this.cartModel.find({ userId: new Types.ObjectId(userId) });
    
    // Khởi tạo các mảng để lưu kết quả
    const warnings: any[] = []; // Các cảnh báo về thay đổi
    const updated: any[] = [];  // Danh sách items đã được cập nhật số lượng
    const removed: any[] = [];  // Danh sách items đã bị xóa

    // Duyệt qua từng item trong cart để validate
    // for...of: loop qua từng phần tử trong mảng
    for (const item of cartItems) {
      // Tìm thông tin stock tương ứng với bookId
      const stock = await this.stockModel.findOne({ bookId: item.bookId });

      // TRƯỜNG HỢP 1: Không tìm thấy stock hoặc stock = 0 (hết hàng)
      // => Xóa item khỏi cart vì không còn hàng để bán
      if (!stock || stock.quantity === 0) {
        await this.cartModel.deleteOne({ _id: item._id });
        // Lưu thông tin item đã xóa
        removed.push({
          bookId: item.bookId,
          oldQuantity: item.quantity,
          reason: 'out_of_stock',
        });
        // Thêm warning để thông báo cho user
        warnings.push({
          bookId: item.bookId,
          message: 'Book is out of stock and has been removed from cart',
        });
        continue; // Bỏ qua item này, chuyển sang item tiếp theo
      }

      // TRƯỜNG HỢP 2: Số lượng trong cart > stock hiện tại
      // => Cập nhật về số lượng tối đa có thể (bằng stock.quantity)
      if (item.quantity > stock.quantity) {
        item.quantity = stock.quantity;
        await item.save(); // Lưu thay đổi vào database
        // Lưu thông tin item đã update
        updated.push({
          bookId: item.bookId,
          oldQuantity: item.quantity,
          newQuantity: stock.quantity,
        });
        // Thêm warning để thông báo cho user về việc điều chỉnh
        warnings.push({
          bookId: item.bookId,
          message: `Quantity adjusted from ${item.quantity} to ${stock.quantity} due to stock availability`,
          availableStock: stock.quantity,
        });
      }
    }

    return {
      updated,
      removed,
      warnings,
    };
  }

  /**
   * CHỨC NĂNG: Xóa toàn bộ giỏ hàng của user
   * @param userId - ID của người dùng
   * @returns Promise với kết quả xóa
   */
  async clearCart(userId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // deleteMany(): xóa tất cả documents thỏa mãn điều kiện
    // Xóa tất cả cart items của user này
    await this.cartModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return new SuccessResponse(null, 'Cart cleared successfully');
  }

  /**
   * CHỨC NĂNG: Đếm số lượng items trong giỏ hàng của user
   * @param userId - ID của người dùng
   * @returns Promise với số lượng items
   */
  async getCartItemCount(userId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // countDocuments(): đếm số lượng documents thỏa mãn điều kiện
    const count = await this.cartModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return new SuccessResponse({ count }, 'Cart count retrieved successfully');
  }

  /**
   * CHỨC NĂNG: Lấy thông tin chi tiết của một cart item
   * @param userId - ID của người dùng
   * @param bookId - ID của sách
   * @returns Promise với thông tin cart item
   */
  async getCartItem(userId: string, bookId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // Tìm một cart item cụ thể và populate thông tin sách
    const cartItem = await this.cartModel
      .findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      })
      .populate('bookId', 'title authors isbn coverUrl thumbnailUrl basePrice pages publisher description categories publishedDate')
      .lean()
      .exec();

    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    // Chuyển bookId sang dạng string
    const bookIdStr: string = (cartItem.bookId as any)._id?.toString() || cartItem.bookId.toString();
    
    // Lấy thông tin stock
    const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookIdStr) }).lean().exec();

    // Transform to match frontend expectations
    const transformedItem = {
      ...cartItem,
      bookId: bookIdStr,
      book: typeof cartItem.bookId === 'object' && cartItem.bookId !== null ? cartItem.bookId : undefined,
      stock: stock
        ? {
            quantity: stock.quantity,
            price: stock.price,
            status: stock.status,
          }
        : undefined,
    };

    return new SuccessResponse(transformedItem, 'Cart item retrieved successfully');
  }

  /**
   * CHỨC NĂNG: Toggle trạng thái chọn/bỏ chọn của một cart item
   * Nếu đang chọn => bỏ chọn, nếu đang bỏ chọn => chọn
   * @param userId - ID của người dùng
   * @param bookId - ID của sách
   * @returns Promise với cart item đã được cập nhật
   */
  async toggleSelectItem(userId: string, bookId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // Tìm cart item hiện tại
    const cartItem = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    // Cập nhật trạng thái isSelected thành giá trị ngược lại
    // findOneAndUpdate(): tìm và update trong một lệnh
    const updated = await this.cartModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      },
      { isSelected: !cartItem.isSelected }, // ! operator: đảo ngược boolean (true => false, false => true)
      { new: true }, // Option này để trả về document SAU KHI update (không phải trước khi update)
    );

    return new SuccessResponse(updated, 'Cart item selection toggled successfully');
  }

  /**
   * CHỨC NĂNG: Cập nhật trạng thái chọn của một cart item với giá trị cụ thể
   * Khác với toggle: đây là set giá trị cụ thể (true hoặc false)
   * @param userId - ID của người dùng
   * @param bookId - ID của sách
   * @param isSelected - Giá trị muốn set (true: chọn, false: bỏ chọn)
   * @returns Promise với cart item đã được cập nhật
   */
  async updateItemSelection(userId: string, bookId: string, isSelected: boolean) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // Tìm và cập nhật trạng thái isSelected
    const cartItem = await this.cartModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      },
      { isSelected }, // Set isSelected = giá trị được truyền vào
      { new: true }, // Trả về document sau khi update
    );

    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(cartItem, 'Cart item selection updated successfully');
  }

  /**
   * CHỨC NĂNG: Chọn tất cả items trong giỏ hàng
   * @param userId - ID của người dùng
   * @returns Promise với kết quả cập nhật
   */
  async selectAllItems(userId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // updateMany(): cập nhật nhiều documents cùng lúc
    // Set isSelected = true cho TẤT CẢ cart items của user
    await this.cartModel.updateMany({ userId: new Types.ObjectId(userId) }, { isSelected: true });

    return new SuccessResponse(null, 'All cart items selected successfully');
  }

  /**
   * CHỨC NĂNG: Bỏ chọn tất cả items trong giỏ hàng
   * @param userId - ID của người dùng
   * @returns Promise với kết quả cập nhật
   */
  async deselectAllItems(userId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // Set isSelected = false cho TẤT CẢ cart items của user
    await this.cartModel.updateMany({ userId: new Types.ObjectId(userId) }, { isSelected: false });

    return new SuccessResponse(null, 'All cart items deselected successfully');
  }

  /**
   * CHỨC NĂNG: Lấy danh sách các items đã được chọn trong giỏ hàng
   * (Thường dùng để tính tổng tiền khi checkout)
   * @param userId - ID của người dùng
   * @returns Promise với danh sách items đã chọn
   */
  async getSelectedItems(userId: string) {
    // Validate định dạng ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // Tìm tất cả cart items có isSelected = true
    const selectedItems = await this.cartModel
      .find({
        userId: new Types.ObjectId(userId),
        isSelected: true as any, // Chỉ lấy items đã được chọn
      })
      .populate('bookId', 'title authors isbn coverUrl thumbnailUrl basePrice pages publisher description categories publishedDate')
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo
      .lean()
      .exec();

    // Transform dữ liệu và thêm thông tin stock
    const transformedItems = await Promise.all(
      selectedItems.map(async (item) => {
        // Chuyển bookId sang string
        const bookIdStr: string = (item.bookId as any)._id?.toString() || item.bookId.toString();
        
        // Lấy thông tin stock cho từng item
        const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookIdStr) }).lean().exec();
        
        // Trả về object với format phù hợp frontend
        return {
          ...item, // Copy tất cả properties từ item gốc
          bookId: bookIdStr, // bookId dạng string
          book: typeof item.bookId === 'object' && item.bookId !== null ? item.bookId : undefined, // Thông tin chi tiết sách
          stock: stock // Thông tin tồn kho
            ? {
                quantity: stock.quantity, // Số lượng còn trong kho
                price: stock.price,       // Giá hiện tại
                status: stock.status,     // Trạng thái (available, out_of_stock, etc.)
              }
            : undefined,
        };
      })
    );

    return new SuccessResponse(transformedItems, 'Selected cart items retrieved successfully');
  }
}
