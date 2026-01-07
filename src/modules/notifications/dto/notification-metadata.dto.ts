import { IsOptional, IsString, IsMongoId, MaxLength } from 'class-validator';

export class NotificationMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Order code must be less than 100 characters' })
  orderCode?: string;

  @IsOptional()
  @IsMongoId()
  bookId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Additional info must be less than 200 characters' })
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Action type must be less than 50 characters' })
  actionType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Redirect URL must be less than 100 characters' })
  redirectUrl?: string;
}

