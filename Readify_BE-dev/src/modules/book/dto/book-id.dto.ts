import { IsMongoId } from 'class-validator';

export class BookIdDto {
  @IsMongoId()
  id: string;
}
