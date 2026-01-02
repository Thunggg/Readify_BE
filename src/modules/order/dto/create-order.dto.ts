import { IsString, IsEnum, IsArray, IsOptional, IsNotEmpty, MinLength, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../constants/order.enum';
import type { PaymentMethodValue } from '../constants/order.enum';

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Must select at least one item from cart' })
  @IsString({ each: true })
  @Type(() => String)
  selectedCartItemIds: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  shippingAddress: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethodValue;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
