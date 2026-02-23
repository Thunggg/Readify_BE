import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // POST /auth/login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(dto);

    const { accessToken, refreshToken } = response.data;


    const accessTokenTtl = this.configService.get<number>('jwt.accessTokenExpiresIn') ?? 3600;
    const refreshTokenTtl = this.configService.get<number>('jwt.refreshTokenExpiresIn') ?? 604800;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: accessTokenTtl * 1000,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: refreshTokenTtl * 1000,
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
    res.clearCookie('refreshToken');
    return response;
  }

  //POST /auth/refresh-token
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.refreshToken(dto.refreshToken);

    const { accessToken } = response.data;

    const accessTokenTtl = this.configService.get<number>('jwt.accessTokenExpiresIn') ?? 3600;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: accessTokenTtl * 1000,
      path: '/',
    });

    return response;
  }
}
