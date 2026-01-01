import { Controller, Get, Param, Post, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { StockService } from './stock.service';
import { StockIdDto } from './dto/stock-id.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  getList() {
    return this.stockService.getStockList();
  }

  @Get(':id')
  getStockDetail(@Param() params: StockIdDto) {
    return this.stockService.getStockDetail(params.id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded',
        statusCode: 400,
      };
    }
    const result = await this.stockService.importStockFromExcel(file.buffer);
    return {
      success: result.success,
      data: result,
      message: result.success ? 'Import thành công' : 'Import thất bại',
    };
  }

  @Get('export/excel')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.stockService.exportStockToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-export.xlsx');
    res.send(buffer);
  }
}
