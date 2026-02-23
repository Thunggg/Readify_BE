// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        const options = configService.get('database.options') as unknown;
        const safeOptions = options && typeof options === 'object' ? (options as Record<string, unknown>) : {};

        return {
          uri,
          ...safeOptions,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
