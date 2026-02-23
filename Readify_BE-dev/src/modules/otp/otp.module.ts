import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { EmailOtp, EmailOtpSchema } from './schemas/email-otp.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule, MongooseModule.forFeature([{ name: EmailOtp.name, schema: EmailOtpSchema }])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
