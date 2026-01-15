import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      maxAge: 15 * 60 * 1000, // 15 phút
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
  async refreshToken(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.refreshToken(dto.refreshToken);

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
