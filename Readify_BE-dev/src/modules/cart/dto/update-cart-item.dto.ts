import { IsMongoId, IsNumber, Min, IsInt } from 'class-validator';

export class UpdateCartItemDto {
  @IsMongoId()
  bookId: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
