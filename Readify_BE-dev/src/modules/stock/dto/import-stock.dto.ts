import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ImportStockRowDto {
  @IsString({ message: 'ISBN must be a string' })
  isbn: string;

  @IsNumber()
  @Min(0, { message: 'Quantity must be a non-negative number' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @IsNumber()
  @Min(0, { message: 'Price must be a non-negative number' })
  price: number;

  @IsOptional()
  @IsString({ message: 'Batch must be a string' })
  batch?: string;

  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  status?: string;
}

export class ImportStockResultDto {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    isbn?: string;
    message: string;
  }>;
}
