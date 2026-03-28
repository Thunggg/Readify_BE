import { IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class ReorderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
