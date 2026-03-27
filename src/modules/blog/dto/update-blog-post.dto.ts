import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsMongoId, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { IsUniqueArray } from '../../../shared/decorators';

export class UpdateBlogPostDto  {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  featuredImage?: string;

  @IsMongoId()
  @IsOptional()
  bookId?: string;

  @IsMongoId()
  categoryId: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((tag) => (typeof tag === 'string' ? tag.trim() : tag))
      : value,
  )
  @IsUniqueArray({ message: 'tags must not contain duplicate values' })
  tags?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
