import { IsMongoId } from 'class-validator';

export class SupplierIdDto {
  @IsMongoId({ message: 'Invalid supplier id' })
  id: string;
}
