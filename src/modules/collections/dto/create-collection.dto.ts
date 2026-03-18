import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty({ message: 'Collection name is required' })
  @MinLength(1, { message: 'Collection name must be at least 1 character long' })
  @MaxLength(120, { message: 'Collection name must be less than 120 characters long' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must be less than 1000 characters long' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Cover image URL must be less than 2000 characters long' })
  coverImageUrl?: string;

  @IsOptional()
  @IsArray({ message: 'bookIds must be an array' })
  @ArrayMaxSize(500, { message: 'bookIds must contain at most 500 items' })
  @IsMongoId({ each: true, message: 'Each bookId must be a valid MongoDB ObjectId' })
  bookIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}
