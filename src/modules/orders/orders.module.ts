import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController, PaymentController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { Book, BookSchema } from '../book/schemas/book.mongoose.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [OrdersController, PaymentController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

