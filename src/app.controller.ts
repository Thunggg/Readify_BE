import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DbService } from './db.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dbService: DbService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('db-check')
  async checkDb() {
    return this.dbService.testConnection();
  }
}
