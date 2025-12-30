import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post('send')
  send(@Body() dto: SendOtpDto) {
    return this.otp.sendOtp(dto);
  }

  @Post('re-send')
  reSend(@Body() dto: SendOtpDto) {
    return this.otp.reSendOtp(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.otp.verifyOtp(dto);
  }
}
