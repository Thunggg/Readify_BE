import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyForgotPasswordOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
