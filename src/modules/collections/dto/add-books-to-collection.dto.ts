import { ArrayMaxSize, ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class AddBooksToCollectionDto {
  @IsArray({ message: 'bookIds must be an array' })
  @ArrayMinSize(1, { message: 'bookIds must contain at least 1 item' })
  @ArrayMaxSize(500, { message: 'bookIds must contain at most 500 items' })
  @IsMongoId({ each: true, message: 'Each bookId must be a valid MongoDB ObjectId' })
  bookIds: string[];
}
