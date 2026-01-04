import { IsMongoId } from 'class-validator';

export class NotificationIdDto {
  @IsMongoId({ message: 'Invalid notification ID format' })
  id: string;
}

