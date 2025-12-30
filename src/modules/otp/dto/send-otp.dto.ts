import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { OtpPurpose } from '../enum/otp-purpose.enum';

export class SendOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(OtpPurpose)
  purpose: 'forgot_password' | 'verify_email';
}
