import { IsNotEmpty, IsOptional, IsString, IsEnum, IsMongoId, MaxLength, MinLength } from 'class-validator';

export enum NotificationType {
  ORDER = 'ORDER',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  ACCOUNT = 'ACCOUNT',
  OTHER = 'OTHER',
}

export class CreateNotificationDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(200, { message: 'Title must be less than 200 characters long' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(1000, { message: 'Content must be less than 1000 characters long' })
  content: string;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Type must be one of: ORDER, PROMOTION, SYSTEM, ACCOUNT, OTHER' })
  type?: NotificationType;

  @IsOptional()
  @IsMongoId()
  relatedOrderId?: string;

  @IsOptional()
  @IsMongoId()
  relatedPromotionId?: string;
}

