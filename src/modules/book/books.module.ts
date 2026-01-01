import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { BooksAdminController } from './controllers/books.admin.controller';
import { BooksPublicController } from './controllers/books.public.controller';
import { BooksAdminService } from './services/books.admin.service';
import { BooksPublicService } from './services/books.public.service';
import { Stock, StockSchema } from '../stock/schemas/stock.schema';
import { Media, MediaSchema } from '../media/schemas/media.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Stock.name, schema: StockSchema },
      { name: Media.name, schema: MediaSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [BooksAdminController, BooksPublicController],
  providers: [BooksAdminService, BooksPublicService],
})
export class BookModule {}
