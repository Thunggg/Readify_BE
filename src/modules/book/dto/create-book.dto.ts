import { ArrayMaxSize, IsArray, IsInt, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  authors?: string[];

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @Type(() => Date)
  publishDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageCount?: number;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsMongoId()
  publisherId: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string; // default VND

  @IsMongoId()
  coverMediaId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsMongoId({ each: true })
  galleryMediaIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  initialQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  importPrice?: number;

  @IsOptional()
  @IsString()
  stockLocation?: string;
}
