import { IsMongoId, IsBoolean } from 'class-validator';

export class UpdateSelectionDto {
  @IsMongoId()
  bookId: string;

  @IsBoolean()
  isSelected: boolean;
}
