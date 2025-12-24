import { IsMongoId } from 'class-validator';

export class StaffIdDto {
  @IsMongoId()
  id: string;
}
