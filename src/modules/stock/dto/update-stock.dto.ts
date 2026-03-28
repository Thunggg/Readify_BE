import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(0, { message: 'Quantity must be a non-negative number' })
  quantity?: number;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be a non-negative number' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'Batch must be a string' })
  batch?: string;

  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;
}
