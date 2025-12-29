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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterAccountDto } from './dto/register-account.dto';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountIdDto } from './dto/account-id.dto';
import { UpdateAccountDto } from './dto/edit-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('register')
  register(@Body() dto: RegisterAccountDto) {
    return this.accountsService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return this.accountsService.me(req?.user?.userId as string);
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
}
