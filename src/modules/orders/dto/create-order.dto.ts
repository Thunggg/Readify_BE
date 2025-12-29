import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../schemas/order.schema';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Book ID is required' })
  bookId: string;

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(100, { message: 'Full name must be less than 100 characters' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @MaxLength(20, { message: 'Phone must be less than 20 characters' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(500, { message: 'Address must be less than 500 characters' })
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City must be less than 100 characters' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'District must be less than 100 characters' })
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Ward must be less than 100 characters' })
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note must be less than 500 characters' })
  note?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty({ message: 'Items are required' })
  items: OrderItemDto[];

  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0, { message: 'Shipping fee must be greater than or equal to 0' })
  shippingFee: number;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsObject()
  @IsNotEmpty({ message: 'Shipping address is required' })
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Note must be less than 1000 characters' })
  note?: string;
}

