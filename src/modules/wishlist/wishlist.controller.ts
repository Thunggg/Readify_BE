import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { BulkMoveToCartDto } from './dto/bulk-move-to-cart.dto';
import { BulkRemoveDto } from './dto/bulk-remove.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(0) // Chỉ customer (role = 0) mới có thể sử dụng wishlist
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  async addToWishlist(@Request() req, @Body() addToWishlistDto: AddToWishlistDto) {
    const userId = req.user.userId;
    return this.wishlistService.addToWishlist(userId, addToWishlistDto);
  }

  @Get()
  async getWishlist(@Request() req) {
    const userId = req.user.userId;
    return this.wishlistService.getWishlistByUserId(userId);
  }

  @Get('count')
  async getWishlistCount(@Request() req) {
    const userId = req.user.userId;
    return this.wishlistService.getWishlistItemCount(userId);
  }

  @Get('check/:bookId')
  async checkBookInWishlist(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.userId;
    return this.wishlistService.checkBookInWishlist(userId, bookId);
  }

  @Delete(':bookId')
  async removeFromWishlist(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.userId;
    return this.wishlistService.removeFromWishlist(userId, bookId);
  }

  @Delete()
  async clearWishlist(@Request() req) {
    const userId = req.user.userId;
    return this.wishlistService.clearWishlist(userId);
  }

  @Post('move-to-cart/:bookId')
  async moveToCart(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.userId;
    return this.wishlistService.moveToCart(userId, bookId);
  }

  // ===== BULK OPERATIONS =====

  // Di chuyển nhiều sách từ wishlist sang cart
  @Post('bulk-move-to-cart')
  async bulkMoveToCart(@Request() req, @Body() bulkMoveDto: BulkMoveToCartDto) {
    const userId = req.user.userId;
    return this.wishlistService.bulkMoveToCart(userId, bulkMoveDto.bookIds);
  }

  // Xóa nhiều sách khỏi wishlist
  @Post('bulk-remove')
  async bulkRemove(@Request() req, @Body() bulkRemoveDto: BulkRemoveDto) {
    const userId = req.user.userId;
    return this.wishlistService.bulkRemove(userId, bulkRemoveDto.bookIds);
  }
}
