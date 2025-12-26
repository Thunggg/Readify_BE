import { Controller, Get, Query } from '@nestjs/common';
import { SearchPublicBooksDto } from '../dto/search-public-books.dto';
import { SearchBookSuggestionsDto } from '../dto/search-book-suggestions.dto';
import { BooksPublicService } from '../services/books.public.service';

@Controller('book')
export class BooksPublicController {
  constructor(private readonly booksPublicService: BooksPublicService) {}

  @Get()
  getBooksList(@Query() query: SearchPublicBooksDto) {
    return this.booksPublicService.getBooksList(query);
  }

   @Get('suggestions')
  getBookSuggestions(@Query() query: SearchBookSuggestionsDto) {
    return this.booksPublicService.getBookSuggestions(query);
  }
}
