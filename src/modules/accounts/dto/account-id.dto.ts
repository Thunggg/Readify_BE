import { IsMongoId } from 'class-validator';

export class AccountIdDto {
  @IsMongoId({ message: 'Invalid account id' })
  id: string;
}
