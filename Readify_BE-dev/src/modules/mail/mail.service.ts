import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
      connectionTimeout: 10_000, // thời gian kết nối TCP tới SMTP server
      greetingTimeout: 10_000, // thời gian chờ phản hồi từ SMTP server
      socketTimeout: 20_000, // thời gian chờ socket
    });
  }

  async sendEmail(params: { to: string; subject: string; text?: string; html?: string }) {
    const from = this.configService.get<string>('mail.user');
    await this.transporter.sendMail({ from, ...params });
  }
}
