import { IsMongoId } from 'class-validator';

export class RemoveFromCartDto {
  @IsMongoId()
  bookId: string;
}
