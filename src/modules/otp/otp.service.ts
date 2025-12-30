import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { EmailOtp, EmailOtpDocument } from './schemas/email-otp.schema';
import { SendOtpDto } from './dto/send-otp.dto';
import { hashPassword } from 'src/shared/utils/bcrypt';
import { ConfigService } from '@nestjs/config';
import { ApiResponse } from 'src/shared/responses/api-response';

type OtpPurpose = 'register';

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

  async sendOtp(dto: SendOtpDto) {
    const { email, purpose } = dto;

    const otp = this.makeOtp();
    const otpHash = await hashPassword(otp, this.configService.get<number>('bcrypt.saltRounds') as number);
    const expiresInMinutes = 5; // 5 phút
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const now = new Date();
    const displayDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const name = email?.includes('@') ? email.split('@')[0] : 'there';

    const html = `<!DOCTYPE html>
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
                <p style="margin: 0; margin-top: 16px; color: #434343;">Copyright © ${now.getFullYear()} Readify.</p>
              </footer>
            </div>
          </body>
        </html>`;

    await this.otpModel.create({ email, otpHash, purpose, expiresAt, lastSentAt: new Date() });
    await this.mail.sendEmail({
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
      html,
    });

    return ApiResponse.success(null, 'OTP sent successfully', 200);
  }
}
