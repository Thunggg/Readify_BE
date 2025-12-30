import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  ValidateNested,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../constants/order.enum';
import type { PaymentMethodValue } from '../constants/order.enum';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  finalAmount: number;

  @IsOptional()
  @IsString()
  promotionId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  shippingAddress: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethodValue;

  @IsOptional()
  @IsString()
  note?: string;
}
