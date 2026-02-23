import { IsMongoId, IsNotEmpty } from 'class-validator';

export class OrderIdDto {
  @IsNotEmpty({ message: 'Order ID is required' })
  @IsMongoId({ message: 'Invalid order ID format' })
  id: string;
}
