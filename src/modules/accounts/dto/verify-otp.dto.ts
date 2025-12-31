import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyRegisterDto {
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP can not be empty' })
  @Length(6, 6, { message: 'OTP must be 6 characters long' })
  otp: string;
}
