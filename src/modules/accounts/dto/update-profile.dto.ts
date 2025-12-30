import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must be less than 100 characters long' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must be less than 100 characters long' })
  lastName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Date of birth must be a date' })
  dateOfBirth?: Date;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone must be less than 20 characters long' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  @MaxLength(255, { message: 'Avatar URL must be less than 255 characters long' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address must be less than 255 characters long' })
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Sex must be a number' })
  sex?: number; // 0 unknown, 1 male, 2 female
}
