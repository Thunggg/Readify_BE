import { Injectable } from '@nestjs/common';
import envConfig from './configs/config';

@Injectable()
export class AppService {
  getHello(): string {
    const config = envConfig.DATABASE_URL ?? '';
    return config;
  }
}
