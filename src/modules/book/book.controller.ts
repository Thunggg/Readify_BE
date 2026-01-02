import { Controller, Get, Query } from '@nestjs/common';
import { BookService } from './book.service';
import { ListBooksDto } from './dto/list-books.dto';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  getBooksList(@Query() query: ListBooksDto) {
    return this.bookService.getBooksList(query);
  }
}

