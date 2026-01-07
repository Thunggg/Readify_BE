import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { RegisterAccountDto } from './dto/register-account.dto';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountIdDto } from './dto/account-id.dto';
import { UpdateAccountDto } from './dto/edit-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enum/otp-purpose.enum';
import { BadRequestException } from '@nestjs/common';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly otpService: OtpService,
  ) {}

  private setOtpCookies(res: Response, email: string, purpose: 'VERIFY_EMAIL' | 'FORGOT_PASSWORD') {
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

  private clearOtpCookies(res: Response) {
    res.clearCookie('otpEmail', { path: '/' });
    res.clearCookie('otpPurpose', { path: '/' });
  }

  private getOtpPurposeFromCookie(raw: string): OtpPurpose {
    if (raw === 'VERIFY_EMAIL') return OtpPurpose.VERIFY_EMAIL;
    if (raw === 'FORGOT_PASSWORD') return OtpPurpose.FORGOT_PASSWORD;
    throw new BadRequestException('Invalid otpPurpose cookie');
  }

  @Post('register')
  async register(@Body() dto: RegisterAccountDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.accountsService.register(dto);

    const email = dto.email.trim().toLowerCase();
    this.setOtpCookies(res, email, OtpPurpose.VERIFY_EMAIL);

    return response;
  }

  @Post('otp/resend')
  otpResend(@Req() req: any) {
    const email = String(req?.cookies?.otpEmail ?? '');
    const purpose = this.getOtpPurposeFromCookie(String(req?.cookies?.otpPurpose ?? ''));

    if (!email || !purpose) throw new BadRequestException('Missing otpEmail or otpPurpose cookie');

    return this.otpService.reSendOtp({ email, purpose });
  }

  @Post('otp/verify')
  async otpVerify(@Body() dto: VerifyOtpDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const email = String(req?.cookies?.otpEmail ?? '');
    const purpose = this.getOtpPurposeFromCookie(String(req?.cookies?.otpPurpose ?? ''));

    if (!email || !purpose) throw new BadRequestException('Missing otpEmail or otpPurpose cookie');

    if (purpose === OtpPurpose.VERIFY_EMAIL) {
      const response = await this.accountsService.verifyRegister(email, String(dto.otp ?? ''));
      this.clearOtpCookies(res);
      return response;
    }

    // FORGOT_PASSWORD
    const response = await this.accountsService.verifyForgotPasswordOtp(email, String(dto.otp ?? ''));
    this.clearOtpCookies(res);

    const token = String(response.data.resetPasswordToken ?? '');
    if (!token) throw new BadRequestException('Failed to issue reset token');

    res.cookie('resetPasswordToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    return new SuccessResponse(null, 'Verify OTP successfully', 200);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return this.accountsService.me(req?.user?.userId as string);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.accountsService.updateProfile(req?.user?.userId as string, dto);
  }

  @Patch('me/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto): Promise<SuccessResponse<null>> {
    return this.accountsService.changePassword(req?.user?.userId as string, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.accountsService.uploadFile(file);
  }

  @Get(':id')
  getAccountDetail(@Param() params: AccountIdDto) {
    return this.accountsService.getAccountDetail(params.id);
  }

  @Get()
  getAccountList(@Query() query: SearchAccountDto) {
    return this.accountsService.getAccountList(query);
  }

  @Post('create')
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccount(dto);
  }

  @Put('edit/:id')
  editAccount(@Param() params: AccountIdDto, @Body() dto: UpdateAccountDto) {
    return this.accountsService.editAccount(params.id, dto);
  }

  @Delete('delete/:id')
  deleteAccount(@Param() params: AccountIdDto) {
    return this.accountsService.deleteAccount(params.id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.accountsService.forgotPassword(dto);

    const email = dto.email.trim().toLowerCase();
    this.setOtpCookies(res, email, OtpPurpose.FORGOT_PASSWORD);

    return response;
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const token = req?.cookies?.resetPasswordToken as string;
    const response = await this.accountsService.resetPassword(token, dto);

    res.clearCookie('resetPasswordToken', { path: '/' });
    this.clearOtpCookies(res);

    return response;
  }
}
