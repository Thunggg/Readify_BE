import { IsMongoId } from 'class-validator';

export class AddToWishlistDto {
  @IsMongoId()
  bookId: string;
}
