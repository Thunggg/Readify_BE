import { IsMongoId } from 'class-validator';

export class StockIdDto {
  @IsMongoId({ message: 'Invalid stock id' })
  id: string;
}
