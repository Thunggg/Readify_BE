import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterAccountDto } from './dto/register-account.dto';
import { OtpPurpose } from '../otp/enum/otp-purpose.enum';
import { SuccessResponse } from 'src/shared/responses/success.response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setOtpCookies(res: Response, email: string, purpose: OtpPurpose) {
    res.cookie('otpEmail', email, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('otpPurpose', purpose, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
  }

  // POST /auth/register
  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(
    @Body() dto: RegisterAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse<null>> {
    const response: SuccessResponse<null> = await this.authService.register(dto);

    const email = dto.email.trim().toLowerCase();
    this.setOtpCookies(res, email, OtpPurpose.VERIFY_EMAIL);

    return response;
  }

  // POST /auth/login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(dto);

    const { accessToken, refreshToken } = response.data;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax', // dev OK
      secure: false, // true khi HTTPS
      maxAge: 10 * 1000, // 10 giây
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax', // dev OK
      secure: false, // true khi HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/',
    });

    return response;
  }

  // POST /auth/logout
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.logout(req?.cookies?.accessToken as string);
    res.clearCookie('accessToken');
    return response;
  }

  //POST /auth/refresh-token
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.refreshToken(req?.cookies?.refreshToken as string);

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
}
