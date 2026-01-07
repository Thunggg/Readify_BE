import {
  IsDate,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAccountDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email can not be empty' })
  @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(255, { message: 'Email must be less than 255 characters long' })
  email?: string;

  @ValidateIf((o) => o.password !== undefined && o.password !== null && o.password !== '')
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255, { message: 'Password must be less than 255 characters long' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must be less than 100 characters long' })
  @MinLength(1, { message: 'First name can not be empty' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must be less than 100 characters long' })
  @MinLength(1, { message: 'Last name can not be empty' })
  lastName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Date of birth must be a date' })
  dateOfBirth?: Date;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone must be less than 20 characters long' })
  @MinLength(1, { message: 'Phone can not be empty' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  @MaxLength(255, { message: 'Avatar URL must be less than 255 characters long' })
  @MinLength(1, { message: 'Avatar URL can not be empty' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address must be less than 255 characters long' })
  @MinLength(1, { message: 'Address can not be empty' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio must be less than 500 characters long' })
  @MinLength(1, { message: 'Bio can not be empty' })
  bio?: string;

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
