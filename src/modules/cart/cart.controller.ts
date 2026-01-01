import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user.userId;
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Get()
  async getCart(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.getCartByUserId(userId);
  }

  @Get('count')
  async getCartCount(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.getCartItemCount(userId);
  }

  @Put()
  async updateQuantity(@Request() req, @Body() updateCartItemDto: UpdateCartItemDto) {
    const userId = req.user.userId;
    return this.cartService.updateQuantity(userId, updateCartItemDto);
  }

  @Delete(':bookId')
  async removeFromCart(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.userId;
    return this.cartService.removeFromCart(userId, bookId);
  }

  @Delete()
  async clearCart(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.clearCart(userId);
  }
}
