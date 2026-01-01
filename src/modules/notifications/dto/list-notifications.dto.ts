import { IsEnum, IsInt, IsOptional, IsBoolean, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from './create-notification.dto';

export class ListNotificationsDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}


