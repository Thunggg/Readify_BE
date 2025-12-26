import { Controller, Get, Query } from '@nestjs/common';
import { SearchPublicBooksDto } from '../dto/search-public-books.dto';
import { BooksPublicService } from '../services/books.public.service';

@Controller('book')
export class BooksPublicController {
  constructor(private readonly booksPublicService: BooksPublicService) {}

  @Get()
  getBooksList(@Query() query: SearchPublicBooksDto) {
    return this.booksPublicService.getBooksList(query);
  }
}
