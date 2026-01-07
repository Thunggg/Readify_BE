import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateSelectionDto } from './dto/update-selection.dto';
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

  // ===== SELECTION ENDPOINTS =====

  @Get('item/:bookId')
  async getCartItem(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.userId;
    return this.cartService.getCartItem(userId, bookId);
  }

  @Get('selected')
  async getSelectedItems(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.getSelectedItems(userId);
  }

  @Patch('toggle-select/:bookId')
  async toggleSelectItem(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.userId;
    return this.cartService.toggleSelectItem(userId, bookId);
  }

  @Patch('update-selection')
  async updateItemSelection(@Request() req, @Body() updateSelectionDto: UpdateSelectionDto) {
    const userId = req.user.userId;
    return this.cartService.updateItemSelection(userId, updateSelectionDto.bookId, updateSelectionDto.isSelected);
  }

  @Patch('select-all')
  async selectAllItems(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.selectAllItems(userId);
  }

  @Patch('deselect-all')
  async deselectAllItems(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.deselectAllItems(userId);
  }
}
