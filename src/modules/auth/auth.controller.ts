import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(dto);

    const { accessToken } = response.data;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax', // dev OK
      secure: false, // true khi HTTPS
      maxAge: 15 * 60 * 1000, // 15 phút
      path: '/',
    });
    return response;
  }

  // POST /auth/verify-email
  //   @Post('verify-email')
  //   verifyEmail(@Body() dto: VerifyEmailDto) {
  //     return this.authService.verifyEmail(dto);
  //   }
}
