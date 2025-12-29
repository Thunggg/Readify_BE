import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(255, { message: 'Title must be less than 255 characters long' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(1, { message: 'Message must be at least 1 character long' })
  @MaxLength(1000, { message: 'Message must be less than 1000 characters long' })
  message: string;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Invalid notification type' })
  type?: NotificationType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

