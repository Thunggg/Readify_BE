import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../constants/order.enum';
import type { OrderStatusValue, PaymentStatusValue } from '../constants/order.enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatusValue;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatusValue;
}
