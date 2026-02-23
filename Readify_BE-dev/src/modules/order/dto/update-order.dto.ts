import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { OrderStatus } from '../constants/order.enum';
import type { OrderStatusValue } from '../constants/order.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Shipping address must be at least 10 characters' })
  shippingAddress?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatusValue;
}
