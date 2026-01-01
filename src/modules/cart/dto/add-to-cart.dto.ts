import { IsMongoId, IsNumber, IsOptional, Min, IsInt } from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  bookId: string;

  @IsOptional()
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number = 1;
}
