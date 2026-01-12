import { IsMongoId } from 'class-validator';

export class StaffIdDto {
  @IsMongoId({ message: 'Invalid staff id format' })
  id: string;
}
