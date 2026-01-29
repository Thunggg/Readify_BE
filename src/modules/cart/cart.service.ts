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
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { bookId, quantity = 1 } = addToCartDto;

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    // Check if book exists in database
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new HttpException(ErrorResponse.notFound('Book not found'), HttpStatus.NOT_FOUND);
    }

    // Check stock availability
    const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookId) });
    if (!stock) {
      throw new HttpException(ErrorResponse.notFound('Book not found in stock'), HttpStatus.NOT_FOUND);
    }

    try {
      // Try to find existing cart item
      const existingItem = await this.cartModel.findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      });

      if (existingItem) {
        // Check if new total quantity exceeds stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > stock.quantity) {
          throw new HttpException(
            ErrorResponse.badRequest(`Not enough stock. Available: ${stock.quantity}, Requested: ${newQuantity}`),
            HttpStatus.BAD_REQUEST,
          );
        }
        // Update quantity if item already exists
        existingItem.quantity = newQuantity;
        const updated = await existingItem.save();
        return new SuccessResponse(updated, 'Item quantity updated in cart successfully');
      }

      // Check if requested quantity exceeds stock for new item
      if (quantity > stock.quantity) {
        throw new HttpException(
          ErrorResponse.badRequest(`Not enough stock. Available: ${stock.quantity}, Requested: ${quantity}`),
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create new cart item
      const newCartItem = new this.cartModel({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
        quantity,
      });

      const created = await newCartItem.save();
      return new SuccessResponse(created, 'Item added to cart successfully');
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(ErrorResponse.badRequest('Book already exists in cart'), HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async updateQuantity(userId: string, updateCartItemDto: UpdateCartItemDto) {
    const { bookId, quantity } = updateCartItemDto;

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    const cartItem = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    // Check stock availability
    const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookId) });
    if (!stock) {
      throw new HttpException(ErrorResponse.notFound('Book not found in stock'), HttpStatus.NOT_FOUND);
    }

    if (quantity > stock.quantity) {
      throw new HttpException(
        ErrorResponse.badRequest(`Not enough stock. Available: ${stock.quantity}, Requested: ${quantity}`),
        HttpStatus.BAD_REQUEST,
      );
    }

    cartItem.quantity = quantity;
    const updated = await cartItem.save();
    return new SuccessResponse(updated, 'Cart item updated successfully');
  }

  async removeFromCart(userId: string, bookId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    const result = await this.cartModel.deleteOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (result.deletedCount === 0) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(null, 'Item removed from cart successfully');
  }

  async getCartByUserId(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    // Validate và tự động cập nhật số lượng trong cart dựa trên stock hiện tại
    const validationResult = await this.validateCartStock(userId);

    // Lấy lại cart items sau khi đã validate và update
    const cartItems = await this.cartModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('bookId', 'title authors isbn coverUrl thumbnailUrl basePrice pages publisher description categories publishedDate')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Transform to match frontend expectations: keep bookId as string, add book as object, add stock info
    const transformedItems = await Promise.all(
      cartItems.map(async (item) => {
        const bookIdStr: string = (item.bookId as any)._id?.toString() || item.bookId.toString();
        
        // Fetch stock information for this book
        const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookIdStr) }).lean().exec();
        
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
   * Validate số lượng trong cart so với stock hiện tại
   * Tự động cập nhật hoặc xóa items nếu stock không đủ
   */
  async validateCartStock(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const cartItems = await this.cartModel.find({ userId: new Types.ObjectId(userId) });
    const warnings: any[] = [];
    const updated: any[] = [];
    const removed: any[] = [];

    // Duyệt qua từng item trong cart
    for (const item of cartItems) {
      const stock = await this.stockModel.findOne({ bookId: item.bookId });

      // Nếu không tìm thấy stock hoặc stock = 0 => xóa item khỏi cart
      if (!stock || stock.quantity === 0) {
        await this.cartModel.deleteOne({ _id: item._id });
        removed.push({
          bookId: item.bookId,
          oldQuantity: item.quantity,
          reason: 'out_of_stock',
        });
        warnings.push({
          bookId: item.bookId,
          message: 'Book is out of stock and has been removed from cart',
        });
        continue;
      }

      // Nếu số lượng trong cart > stock hiện tại => cập nhật về số lượng tối đa có thể
      if (item.quantity > stock.quantity) {
        item.quantity = stock.quantity;
        await item.save();
        updated.push({
          bookId: item.bookId,
          oldQuantity: item.quantity,
          newQuantity: stock.quantity,
        });
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

  async clearCart(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    await this.cartModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return new SuccessResponse(null, 'Cart cleared successfully');
  }

  async getCartItemCount(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const count = await this.cartModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return new SuccessResponse({ count }, 'Cart count retrieved successfully');
  }

  async getCartItem(userId: string, bookId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

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

    const bookIdStr: string = (cartItem.bookId as any)._id?.toString() || cartItem.bookId.toString();
    
    // Fetch stock information
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

  async toggleSelectItem(userId: string, bookId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    const cartItem = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    const updated = await this.cartModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      },
      { isSelected: !cartItem.isSelected },
      { new: true },
    );

    return new SuccessResponse(updated, 'Cart item selection toggled successfully');
  }

  async updateItemSelection(userId: string, bookId: string, isSelected: boolean) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
    }

    const cartItem = await this.cartModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      },
      { isSelected },
      { new: true },
    );

    if (!cartItem) {
      throw new HttpException(ErrorResponse.notFound('Cart item not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(cartItem, 'Cart item selection updated successfully');
  }

  async selectAllItems(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    await this.cartModel.updateMany({ userId: new Types.ObjectId(userId) }, { isSelected: true });

    return new SuccessResponse(null, 'All cart items selected successfully');
  }

  async deselectAllItems(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    await this.cartModel.updateMany({ userId: new Types.ObjectId(userId) }, { isSelected: false });

    return new SuccessResponse(null, 'All cart items deselected successfully');
  }

  async getSelectedItems(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const selectedItems = await this.cartModel
      .find({
        userId: new Types.ObjectId(userId),
        isSelected: true as any,
      })
      .populate('bookId', 'title authors isbn coverUrl thumbnailUrl basePrice pages publisher description categories publishedDate')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Transform to match frontend expectations and add stock info
    const transformedItems = await Promise.all(
      selectedItems.map(async (item) => {
        const bookIdStr: string = (item.bookId as any)._id?.toString() || item.bookId.toString();
        
        // Fetch stock information
        const stock = await this.stockModel.findOne({ bookId: new Types.ObjectId(bookIdStr) }).lean().exec();
        
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

    return new SuccessResponse(transformedItems, 'Selected cart items retrieved successfully');
  }
}
