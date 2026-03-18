import { IsMongoId } from 'class-validator';

export class CollectionIdDto {
  @IsMongoId({ message: 'Invalid collection ID format' })
  id: string;
}
