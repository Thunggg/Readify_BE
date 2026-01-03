import {
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountRole } from 'src/modules/staff/constants/staff.enum';
import { Prop } from '@nestjs/mongoose';
import { MinAge } from 'src/shared/validators/min-age.validator';

export class CreateAccountDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email can not be empty' })
  @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(255, { message: 'Email must be less than 255 characters long' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255, { message: 'Password must be less than 255 characters long' })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must be less than 100 characters long' })
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must be less than 100 characters long' })
  lastName?: string;

  @IsString({ message: 'dateOfBirth must be a valid ISO date string' })
  @IsNotEmpty({ message: 'dateOfBirth can not be empty' })
  @MinAge(16, { message: 'You must be at least 16 years old' })
  dateOfBirth?: Date;

  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone must be less than 20 characters long' })
  phone?: string;

  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address must be less than 255 characters long' })
  address?: string;

  @IsEnum(AccountRole)
  @Type(() => Number)
  @IsInt({ message: 'Role must be a number' })
  @Prop({ default: AccountRole.USER })
  role: number;

  // 1: active, 0: inactive, 2: not active email
  @Type(() => Number)
  @IsInt({ message: 'Status must be a number' })
  status?: number;

  @Type(() => Number)
  @IsInt({ message: 'Sex must be a number' })
  sex?: number; // 0 unknown, 1 male, 2 female
}
