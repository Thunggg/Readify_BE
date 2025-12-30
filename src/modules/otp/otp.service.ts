import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { EmailOtp, EmailOtpDocument } from './schemas/email-otp.schema';
import { SendOtpDto } from './dto/send-otp.dto';
import { comparePassword, hashPassword } from 'src/shared/utils/bcrypt';
import { ConfigService } from '@nestjs/config';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(EmailOtp.name) private readonly otpModel: Model<EmailOtpDocument>,
    private readonly mail: MailService,
    private readonly configService: ConfigService,
  ) {}

  private makeOtp(): string {
    const n = Math.floor(Math.random() * 1_000_000);
    return String(n).padStart(6, '0');
  }

  private get expiresInMinutes(): number {
    return Number(this.configService.get<number>('otp.expiresInMinutes') ?? 5);
  }

  private get cooldownMs(): number {
    return Number(this.configService.get<number>('otp.cooldownMs') ?? 60_000);
  }

  private get blockMs(): number {
    return Number(this.configService.get<number>('otp.blockMs') ?? 15 * 60_000);
  }

  private get maxResendCount(): number {
    return Number(this.configService.get<number>('otp.maxResendCount') ?? 10);
  }

  private get maxAttempts(): number {
    return Number(this.configService.get<number>('otp.maxAttempts') ?? 10);
  }

  private buildOtpHtml(params: { displayDate: string; name: string; otp: string; expiresInMinutes: number }): string {
    const { displayDate, name, otp, expiresInMinutes } = params;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <title>OTP Verification</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
          </head>
          <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
            <div
              style="
                max-width: 680px;
                margin: 0 auto;
                padding: 45px 30px 60px;
                background: #f4f7ff;
                background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
                background-repeat: no-repeat;
                background-size: 800px 452px;
                background-position: top center;
                font-size: 14px;
                color: #434343;
              "
            >
              <header>
                <table style="width: 100%;">
                  <tbody>
                    <tr style="height: 0;">
                      <td>
                        <div style="height: 30px; line-height: 30px; font-weight: 600; color: #ffffff;">Readify</div>
                      </td>
                      <td style="text-align: right;">
                        <span style="font-size: 16px; line-height: 30px; color: #ffffff;">${displayDate}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </header>
              <main>
                <div
                  style="
                    margin: 0;
                    margin-top: 70px;
                    padding: 92px 30px 115px;
                    background: #ffffff;
                    border-radius: 30px;
                    text-align: center;
                  "
                >
                  <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #1f1f1f;">Your OTP</h1>
                    <p style="margin: 0; margin-top: 17px; font-size: 16px; font-weight: 500;">Hey ${name},</p>
                    <p style="margin: 0; margin-top: 17px; font-weight: 500; letter-spacing: 0.56px;">
                      Use the following OTP to complete your verification. OTP is valid for
                      <span style="font-weight: 600; color: #1f1f1f;">${expiresInMinutes} minutes</span>.
                      Do not share this code with anyone.
                    </p>
                    <p
                      style="
                        margin: 0;
                        margin-top: 60px;
                        font-size: 40px;
                        font-weight: 600;
                        letter-spacing: 12px;
                        color: #ba3d4f;
                      "
                    >
                      ${otp}
                    </p>
                  </div>
                </div>
                <p
                  style="
                    max-width: 400px;
                    margin: 0 auto;
                    margin-top: 90px;
                    text-align: center;
                    font-weight: 500;
                    color: #8c8c8c;
                  "
                >
                  Need help? Reply to this email.
                </p>
              </main>
              <footer
                style="
                  width: 100%;
                  max-width: 490px;
                  margin: 20px auto 0;
                  text-align: center;
                  border-top: 1px solid #e6ebf1;
                "
              >
                <p style="margin: 0; margin-top: 40px; font-size: 16px; font-weight: 600; color: #434343;">Readify</p>
                <p style="margin: 0; margin-top: 8px; color: #434343;">This is an automated message. Please do not share your OTP.</p>
                <p style="margin: 0; margin-top: 16px; color: #434343;">Copyright © ${year} Readify.</p>
              </footer>
            </div>
          </body>
        </html>`;
  }

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const { purpose } = dto;

    const record = await this.otpModel.findOne({ email, purpose });
    if (record) {
      throw new HttpException(ErrorResponse.badRequest('OTP already sent'), HttpStatus.BAD_REQUEST);
    }

    const otp = this.makeOtp();
    const otpHash = await hashPassword(otp, this.configService.get<number>('bcrypt.saltRounds') as number);
    const expiresInMinutes = this.expiresInMinutes;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const now = new Date();
    const displayDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const name = email?.includes('@') ? email.split('@')[0] : 'there';

    const html = this.buildOtpHtml({ displayDate, name, otp, expiresInMinutes });

    // Upsert to avoid duplicate key errors on (email, purpose)
    await this.otpModel.updateOne(
      { email, purpose },
      {
        $set: {
          email,
          purpose,
          otpHash,
          expiresAt,
          lastSentAt: now,
          attempts: 0,
          resendCount: 0,
          blockedUntil: undefined,
        },
      },
      { upsert: true },
    );

    try {
      await this.mail.sendEmail({
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        html,
      });
    } catch (err) {
      // roll back tránh lưu OTP không gửi được
      await this.otpModel.deleteOne({ email, purpose });
      throw new HttpException(ErrorResponse.internal('Failed to send OTP email'), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return ApiResponse.success(null, 'OTP sent successfully', 200);
  }

  async reSendOtp(dto: SendOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const { purpose } = dto;

    const record = await this.otpModel.findOne({ email, purpose });

    if (!record) {
      throw new HttpException(ErrorResponse.notFound('OTP record not found'), HttpStatus.NOT_FOUND);
    }

    // Trường hợp bị block
    if (record.blockedUntil && record.blockedUntil > new Date()) {
      const waitSecond = Math.ceil((new Date(record.blockedUntil).getTime() - Date.now()) / 1000);
      throw new HttpException(
        ErrorResponse.badRequest(`You must wait ${waitSecond} seconds before requesting a new OTP`),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Trường hợp đã hết thời gian chờ
    if (record.blockedUntil && record.blockedUntil.getTime() < Date.now()) {
      record.blockedUntil = undefined;
      record.resendCount = 0;
      await record.save();
    }

    // Check cooldown
    const cooldownMs = this.cooldownMs;
    if (record.lastSentAt && Date.now() - new Date(record.lastSentAt).getTime() < cooldownMs) {
      throw new HttpException(
        ErrorResponse.badRequest(`You must wait ${Math.ceil(cooldownMs / 1000)} seconds before requesting a new OTP`),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const blockMs = this.blockMs;
    const maxResend = this.maxResendCount;
    // Check maximum resend count
    if (record.resendCount >= maxResend) {
      record.blockedUntil = new Date(Date.now() + blockMs);

      await record.save();

      throw new HttpException(
        ErrorResponse.badRequest('You have reached the maximum number of resends'),
        HttpStatus.BAD_REQUEST,
      );
    }

    const now = new Date();
    const displayDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const name = email?.includes('@') ? email.split('@')[0] : 'there';

    const otp = this.makeOtp();
    const otpHash = await hashPassword(otp, this.configService.get<number>('bcrypt.saltRounds') as number);
    const expiresInMinutes = this.expiresInMinutes;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const html = this.buildOtpHtml({ displayDate, name, otp, expiresInMinutes });

    // Update DB first to ensure OTP in email matches what we verify against.
    // If email sending fails, revert to the previous OTP fields.
    const prev = {
      otpHash: record.otpHash,
      expiresAt: record.expiresAt,
      lastSentAt: record.lastSentAt,
      resendCount: record.resendCount,
    };

    await this.otpModel.updateOne(
      { _id: record._id },
      { $set: { otpHash, expiresAt, lastSentAt: now }, $inc: { resendCount: 1 } },
    );

    try {
      await this.mail.sendEmail({
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        html,
      });
    } catch (err) {
      // rollback lại OTP cũ để tránh lưu OTP không gửi được
      await this.otpModel.updateOne(
        { _id: record._id },
        {
          $set: {
            otpHash: prev.otpHash,
            expiresAt: prev.expiresAt,
            lastSentAt: prev.lastSentAt,
            resendCount: prev.resendCount,
          },
        },
      );
      throw new HttpException(ErrorResponse.internal('Failed to send OTP email'), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return ApiResponse.success(null, 'OTP resent successfully', 200);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const { otp, purpose } = dto;

    const record = await this.otpModel.findOne({ email, purpose });

    if (!record) {
      throw new HttpException(ErrorResponse.notFound('OTP record not found'), HttpStatus.NOT_FOUND);
    }

    if (record.expiresAt < new Date()) {
      throw new HttpException(ErrorResponse.badRequest('OTP has expired'), HttpStatus.BAD_REQUEST);
    }

    // Trường hợp bị block
    if (record.blockedUntil && record.blockedUntil > new Date()) {
      const waitSecond = Math.ceil((new Date(record.blockedUntil).getTime() - Date.now()) / 1000);
      throw new HttpException(
        ErrorResponse.badRequest(`You must wait ${waitSecond} seconds before submit a new OTP`),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Trường hợp đã hết thời gian chờ
    if (record.blockedUntil && record.blockedUntil.getTime() < Date.now()) {
      record.blockedUntil = undefined;
      record.attempts = 0;
      await record.save();
    }

    const blockMs = this.blockMs;
    if (record.attempts >= this.maxAttempts) {
      record.blockedUntil = new Date(Date.now() + blockMs);

      await record.save();
      throw new HttpException(ErrorResponse.badRequest('OTP too many attempts'), HttpStatus.TOO_MANY_REQUESTS);
    }

    const checkOtp = await comparePassword(otp, record.otpHash);
    if (!checkOtp) {
      await this.otpModel.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      throw new HttpException(ErrorResponse.badRequest('OTP invalid'), HttpStatus.BAD_REQUEST);
    }

    await this.otpModel.deleteOne({ _id: record._id });
    return ApiResponse.success(null, 'Verify OTP successfully', 200);
  }
}
