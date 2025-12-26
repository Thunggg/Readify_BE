import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BooksAdminService } from '../services/books.admin.service';
import { SearchAdminBooksDto } from '../dto/search-admin-books.dto';
import { BookIdDto } from '../dto/book-id.dto';
import { CreateBookDto } from '../dto/create-book.dto';

@Controller('admin/book')
export class BooksAdminController {
  constructor(private readonly booksAdminService: BooksAdminService) {}

  @Get()
  getAdminBookList(@Query() query: SearchAdminBooksDto) {
    return this.booksAdminService.getAdminBookList(query);
  }

  @Get(':id')
  getAdminBookDetail(@Param() params: BookIdDto) {
    return this.booksAdminService.getAdminBookDetail(params.id);
  }

  @Post()
  addBook(@Body() dto: CreateBookDto) {
    return this.booksAdminService.addBook(dto);
  }
}
