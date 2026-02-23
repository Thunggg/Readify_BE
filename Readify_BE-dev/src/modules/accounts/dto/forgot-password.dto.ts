import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}
