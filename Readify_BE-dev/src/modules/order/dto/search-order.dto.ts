import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod, PaymentStatus, OrderSortBy, SortOrder } from '../constants/order.enum';
import type {
  OrderStatusValue,
  PaymentMethodValue,
  PaymentStatusValue,
  OrderSortByValue,
  SortOrderValue,
} from '../constants/order.enum';

export class SearchOrderDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatusValue;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethodValue;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatusValue;

  @IsOptional()
  @IsEnum(OrderSortBy)
  sortBy: OrderSortByValue = OrderSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrderValue = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
