import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Matches,
  Length,
  IsDateString,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookStatus, BookLanguage, BookCurrency } from '../enums/book.enum';
import { IsTitle, IsSlug, IsUniqueArray } from '../../../shared/decorators';

export class CreateBookDto {
  @IsString({ message: 'Title must be a string' })
  @IsTitle()
  title: string;

  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  @IsSlug()
  slug?: string;

  @IsOptional()
  @IsString({ message: 'Subtitle must be a string' })
  @Length(0, 500, { message: 'Subtitle cannot exceed 500 characters' })
  subtitle?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Authors must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 authors allowed' })
  @IsMongoId({ each: true, message: 'Each author ID must be a valid MongoDB ID' })
  @IsUniqueArray()
  authors?: string[];

  @IsOptional()
  @IsEnum(BookLanguage, {
    message: `Language must be one of: ${Object.values(BookLanguage).join(', ')}`,
  })
  language?: BookLanguage;

  @IsOptional()
  @IsDateString({}, { message: 'Publish date must be ISO 8601 date string' })
  publishDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page count must be an integer' })
  @Min(1, { message: 'Page count must be at least 1' })
  @Max(20000, { message: 'Page count cannot exceed 20,000 pages' })
  pageCount?: number;

  @IsOptional()
  @IsString({ message: 'ISBN must be a string' })
  @Matches(/^(?:\d{9}[\dX]|\d{13})$/, {
    message: 'Invalid ISBN format (must be ISBN-10 or ISBN-13)',
  })
  isbn?: string;

  @IsMongoId({ message: 'Publisher ID must be a valid MongoDB ID' })
  publisherId: string;

  @IsArray({ message: 'Category IDs must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 categories allowed' })
  @IsMongoId({ each: true, message: 'Each category ID must be a valid MongoDB ID' })
  @IsUniqueArray()
  categoryIds: string[];

  @Type(() => Number)
  @IsNumber({}, { message: 'Base price must be a number' })
  @Min(0, { message: 'Base price must be greater than or equal to 0' })
  @Max(10000000000, { message: 'Base price must be less than or equal to 10,000,000,000  (10 billion)' })
  basePrice: number;

  @IsOptional()
  @IsEnum(BookCurrency, {
    message: `Currency must be one of: ${Object.values(BookCurrency).join(', ')}`,
  })
  currency?: BookCurrency;

  @IsOptional()
  @IsArray({ message: 'Images must be an array' })
  @ArrayMinSize(1, { message: 'At least 1 image is required' })
  @ArrayMaxSize(20, { message: 'Maximum 20 images allowed' })
  @IsMongoId({ each: true, message: 'Each image ID must be a valid MongoDB ID' })
  @IsUniqueArray()
  images?: string[];

  @IsOptional()
  @IsString({ message: 'Thumbnail URL must be a string' })
  thumbnailUrl?: string;

  // @IsOptional()
  // @Type(() => Number)
  // @IsEnum(BookStatus, {
  //   message: `Status must be one of: ${Object.values(BookStatus)
  //     .filter((v) => typeof v === 'number')
  //     .join(', ')}`,
  // })
  // status?: BookStatus;

  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @IsUniqueArray()
  @ArrayMaxSize(20, { message: 'Maximum 20 tags allowed' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Initial quantity must be an integer' })
  @Min(0, { message: 'Initial quantity cannot be negative' })
  @Max(100000, { message: 'Initial quantity cannot exceed 100,000' })
  initialQuantity?: number;

  @IsOptional()
  @IsString({ message: 'Stock location must be a string' })
  stockLocation?: string;
}
