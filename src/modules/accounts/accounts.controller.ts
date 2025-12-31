import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { VerifyRegisterDto } from './dto/verify-otp.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('register')
  async register(@Body() dto: RegisterAccountDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.accountsService.register(dto);

    const email = dto.email.trim().toLowerCase();
    res.cookie('regEmail', email, {
      httpOnly: true,
      sameSite: 'lax', // dev OK
      secure: false, // true khi HTTPS
      maxAge: 15 * 60 * 1000, // 15 phút
      path: '/',
    });

    return response;
  }

  @Post('register/resend-otp')
  resendRegisterOtp(@Req() req: any) {
    return this.accountsService.resendRegisterOtp(req?.cookies?.regEmail as string);
  }

  @Post('register/verify')
  async verifyRegister(@Body() dto: VerifyRegisterDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const email = req?.cookies?.regEmail as string;
    const response = await this.accountsService.verifyRegister(email, dto.otp);

    res.clearCookie('regEmail', { path: '/' });
    return response;
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

  @Patch('edit/:id')
  editAccount(@Param() params: AccountIdDto, @Body() dto: UpdateAccountDto) {
    return this.accountsService.editAccount(params.id, dto);
  }

  @Delete('delete/:id')
  deleteAccount(@Param() params: AccountIdDto) {
    return this.accountsService.deleteAccount(params.id);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    return this.accountsService.forgotPassword(dto);
  }

  @Post('forgot-password/re-send')
  resendForgotPasswordOtp(@Body() dto: ForgotPasswordRequestDto) {
    return this.accountsService.resendForgotPasswordOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.accountsService.resetPassword(dto);
  }
}
