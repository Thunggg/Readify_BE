import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchPublicBooksDto } from '../dto/search-public-books.dto';
import { SearchBookSuggestionsDto } from '../dto/search-book-suggestions.dto';
import { BooksPublicService } from '../services/books.public.service';
import { BookSlugDto } from '../dto/book-slug.dto';
import { BookIdDto } from '../dto/book-id.dto';

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

  @Get('slug/:slug')
  getBookDetailBySlug(@Param() params: BookSlugDto) {
    return this.booksPublicService.getBookDetailBySlug(params.slug);
  }

  @Get(':id')
  getBookDetailById(@Param() params: BookIdDto) {
    return this.booksPublicService.getBookDetailById(params.id);
  }

  @Get(':id/related')
  getRelatedBooks(@Param() params: BookIdDto, @Query('limit') limit?: string) {
    return this.booksPublicService.getRelatedBooks(params.id, limit);
  }

  @Get('slug/:slug/related')
  getRelatedBookBySlug(@Param() params: BookSlugDto, @Query('limit') limit?: string) {
    return this.booksPublicService.getRelatedBookBySlug(params.slug, limit);
  }
}
