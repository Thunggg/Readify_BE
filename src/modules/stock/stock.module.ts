import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  ],
  providers: [StockService],
  controllers: [StockController],
  exports: [StockService],
})
export class StockModule {}
