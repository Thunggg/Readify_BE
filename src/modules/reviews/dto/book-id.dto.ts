import { IsMongoId } from 'class-validator';

export class BookIdDto {
  @IsMongoId({ message: 'Invalid book ID format' })
  bookId: string;
}

