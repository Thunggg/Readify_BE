import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { OtpPurpose } from '../enum/otp-purpose.enum';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
