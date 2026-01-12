import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MinAge } from 'src/shared/validators/min-age.validator';

export class RegisterAccountDto {
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name can not be empty' })
  @MaxLength(100, { message: 'First name must be less than 100 characters long' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name can not be empty' })
  @MaxLength(100, { message: 'Last name must be less than 100 characters long' })
  lastName: string;

  @IsString({ message: 'Phone must be a string' })
  @IsNotEmpty({ message: 'Phone can not be empty' })
  @MaxLength(30, { message: 'Phone must be less than 30 characters long' })
  @Matches(/^[0-9]+$/, { message: 'Phone must be a number' })
  phone: string;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address can not be empty' })
  @MaxLength(500, { message: 'Address must be less than 500 characters long' })
  address: string;

  // Expect ISO string from client (e.g. "2000-01-31" or full ISO datetime)
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO date string' })
  @IsNotEmpty({ message: 'dateOfBirth can not be empty' })
  @MinAge(16, { message: 'You must be at least 16 years old' })
  dateOfBirth: string;

  // 0: unknown, 1: male, 2: female
  @Type(() => Number)
  @IsInt({ message: 'Sex must be an integer' })
  @IsNotEmpty({ message: 'Sex can not be empty' })
  @Min(0, { message: 'Sex must be >= 0' })
  @Max(2, { message: 'Sex must be <= 2' })
  sex: number;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email can not be empty' })
  @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(255, { message: 'Email must be less than 255 characters long' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Password must be less than 255 characters long' })
  password: string;

  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password can not be empty' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Confirm password must be less than 255 characters long' })
  confirmPassword: string;
}
