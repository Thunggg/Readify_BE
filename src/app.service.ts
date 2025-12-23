import { Injectable } from '@nestjs/common';
import envConfig from './configs/config';

@Injectable()
export class AppService {
  getHello(): string {
    const config = envConfig.MONGODB_URI;
    return config;
  }
}
