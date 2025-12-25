import { Controller, Get, Param, Post, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StockService } from './stock.service';
import { ApiResponse } from '../../shared/responses/api-response';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async list() {
    const items = await this.stockService.findAll();
    return ApiResponse.success(items);
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<any> {
    const result = await this.stockService.findOne(id);
    return ApiResponse.success(result);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return ApiResponse.error('No file uploaded', 'FILE_REQUIRED', 400);
    }
    const result = await this.stockService.importStockFromExcel(file.buffer);
    return ApiResponse.success(result);
  }
}
