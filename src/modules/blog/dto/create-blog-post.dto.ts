import { IsString, IsOptional, IsMongoId, IsArray, IsIn, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBlogPostDto {
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
  tags?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
