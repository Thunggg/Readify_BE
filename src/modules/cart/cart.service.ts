import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Stock, StockDocument } from '../stock/schemas/stock.schema';
import { ApiResponse } from '../../shared/responses/api-response';
import { ErrorResponse } from '../../shared/responses/error.response';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
  ) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { bookId, quantity = 1 } = addToCartDto;

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid userId or bookId');
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
        return ApiResponse.success(updated, 'Item quantity updated in cart successfully');
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
      return ApiResponse.success(created, 'Item added to cart successfully');
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          ErrorResponse.badRequest('Book already exists in cart'),
          HttpStatus.BAD_REQUEST,
        );
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
    return ApiResponse.success(updated, 'Cart item updated successfully');
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

    return ApiResponse.success(null, 'Item removed from cart successfully');
  }

  async getCartByUserId(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const cartItems = await this.cartModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('bookId', 'title author isbn coverUrl pages publisher description categories publishedDate')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return ApiResponse.success(cartItems, 'Cart retrieved successfully');
  }

  async clearCart(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    await this.cartModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    return ApiResponse.success(null, 'Cart cleared successfully');
  }

  async getCartItemCount(userId: string) {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const count = await this.cartModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return ApiResponse.success({ count }, 'Cart count retrieved successfully');
  }
}
