import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { Promotion, PromotionSchema } from '../promotion/schemas/promotion.schema';
import { PromotionLogModule } from '../promotion-log/promotion-log.module';
import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { Book, BookSchema } from '../book/schemas/book.schema';
import { Stock, StockSchema } from '../stock/schemas/stock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Promotion.name, schema: PromotionSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Book.name, schema: BookSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
    PromotionLogModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
