import { Type } from 'class-transformer';
import { IsDate, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MinAge } from 'src/shared/validators/min-age.validator';

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
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO date string' })
  @IsNotEmpty({ message: 'dateOfBirth can not be empty' })
  @MinAge(16, { message: 'You must be at least 16 years old' })
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

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio must be less than 500 characters long' })
  bio?: string;
}
