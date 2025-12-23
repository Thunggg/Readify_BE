import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterAccountDto {
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
}
