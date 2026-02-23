import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyPromotionDto {
  @IsNotEmpty({ message: 'Promotion code is required' })
  @IsString()
  code: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Order value must be at least 0' })
  orderValue: number;
}
