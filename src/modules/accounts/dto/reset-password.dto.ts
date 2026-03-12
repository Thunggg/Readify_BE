import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password can not be empty' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(255, { message: 'New password must be less than 255 characters long' })
  newPassword: string;

  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password can not be empty' })
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(255, { message: 'Confirm password must be less than 255 characters long' })
  confirmPassword: string;
}
