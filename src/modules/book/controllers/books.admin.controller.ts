import { Body, Controller, Get, Param, Patch, Post, Query, Delete } from '@nestjs/common';
import { BooksAdminService } from '../services/books.admin.service';
import { SearchAdminBooksDto } from '../dto/search-admin-books.dto';
import { BookIdDto } from '../dto/book-id.dto';
import { BookSlugDto } from '../dto/book-slug.dto';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

@Controller('admin/book')
export class BooksAdminController {
  constructor(private readonly booksAdminService: BooksAdminService) {}

  @Get()
  getAdminBookList(@Query() query: SearchAdminBooksDto) {
    return this.booksAdminService.getAdminBookList(query);
  }

  @Get('slug/:slug')
  getBookBySlug(@Param() params: BookSlugDto) {
    return this.booksAdminService.getBookBySlug(params.slug);
  }

  @Get(':id')
  getAdminBookDetail(@Param() params: BookIdDto) {
    return this.booksAdminService.getAdminBookDetail(params.id);
  }

  @Post()
  addBook(@Body() dto: CreateBookDto) {
    return this.booksAdminService.addBook(dto);
  }

  @Patch(':id')
  updateBook(@Param() params: BookIdDto, @Body() dto: UpdateBookDto) {
    return this.booksAdminService.updateBook(params.id, dto);
  }

  @Delete(':id')
  deleteBook(@Param() params: BookIdDto) {
    return this.booksAdminService.deleteBook(params.id);
  }

  @Patch(':id/restore')
  restoreBook(@Param() params: BookIdDto) {
    return this.booksAdminService.restoreBook(params.id);
  }
}
