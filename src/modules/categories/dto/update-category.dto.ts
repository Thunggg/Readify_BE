import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Category name must be at least 1 character long' })
  @MaxLength(100, { message: 'Category name must be less than 100 characters long' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be less than 500 characters long' })
  description?: string;
}

