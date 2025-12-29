import { IsDate, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAccountDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email can not be empty' })
  @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(255, { message: 'Email must be less than 255 characters long' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255, { message: 'Password must be less than 255 characters long' })
  password?: string;

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

  // 1: active, 0: inactive, 2: not active email
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Status must be a number' })
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Sex must be a number' })
  sex?: number; // 0 unknown, 1 male, 2 female
}
