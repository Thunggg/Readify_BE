// src/modules/book/services/helpers/validate-for-publish.ts
import { validateSync } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { CreateBookDto } from '../../dto/create-book.dto';
import { Book } from '../../schemas/book.schema';
import { BookStatus } from '../../enums/book.enum';

export function validateForPublish(book: Book) {
  const errors: { field: string; message: string }[] = [];

  // 1️⃣ Reuse DTO validation (basic checks)
  const dtoCheck = Object.assign(new CreateBookDto(), {
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    authors: book.authors,
    basePrice: book.basePrice,
    currency: book.currency,
    isbn: book.isbn,
    pageCount: book.pageCount,
    publishDate: book.publishDate,
    categoryIds: book.categoryIds,
    images: book.images,
    tags: book.tags,
    // stockLocation: book.stockLocation,
    // initialQuantity: book.initialQuantity,
    publisherId: book.publisherId,
  });

  const dtoErrors = validateSync(dtoCheck, { whitelist: true });
  if (dtoErrors.length > 0) {
    dtoErrors.forEach(e => {
      Object.values(e.constraints || {}).forEach(msg => {
        errors.push({ field: e.property, message: msg });
      });
    });
  }

  // 2️⃣ System / business checks

  // slug bắt buộc phải có
  if (!book.slug || book.slug.trim().length === 0) {
    errors.push({ field: 'slug', message: 'Slug is missing or empty' });
  }

  // phải có ít nhất 1 ảnh
  if (!book.images || book.images.length === 0) {
    errors.push({ field: 'images', message: 'At least one cover image is required' });
  }

  // phải có ít nhất 1 category
  if (!book.categoryIds || book.categoryIds.length === 0) {
    errors.push({ field: 'categoryIds', message: 'At least one category is required' });
  }

  // ISBN hợp lệ (10 hoặc 13 ký tự số)
  if (!book.isbn || !/^(?:\d{9}[\dX]|\d{13})$/.test(book.isbn)) {
    errors.push({ field: 'isbn', message: 'ISBN must be 10 or 13 digits' });
  }

  // phải có language
  if (!book.language || book.language.trim().length === 0) {
    errors.push({ field: 'language', message: 'Language is required' });
  }

  // status phải là DRAFT trước khi publish
  if (book.status !== undefined && book.status !== BookStatus.DRAFT) {
    errors.push({ field: 'status', message: 'Only draft books can be published' });
  }

  // Giá > 0
  if (!book.basePrice || book.basePrice <= 0) {
    errors.push({ field: 'basePrice', message: 'Base price must be greater than 0' });
  }

  if (errors.length > 0) {
    throw new BadRequestException({
      message: 'Book is not ready to be published',
      errors,
    });
  }
}
