import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegisterAccountDto } from './dto/register-account.dto';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('register')
  register(@Body() dto: RegisterAccountDto) {
    return this.accountsService.register(dto);
  }
}
