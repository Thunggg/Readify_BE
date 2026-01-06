import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { Book, BookSchema } from '../book/schemas/book.schema';
import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { Stock, StockSchema } from '../stock/schemas/stock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Book.name, schema: BookSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
