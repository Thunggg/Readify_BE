import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { StockService } from './stock.service';
import { StockIdDto } from './dto/stock-id.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { SuccessResponse } from '../../shared/responses/success.response';
import { ErrorResponse } from '../../shared/responses/error.response';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('stocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1, 3) // Admin = 1, Warehouse Staff = 3
@ApiTags('Stock')
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  getList() {
    return this.stockService.getStockList();
  }

  @Get('alerts')
  getStockAlerts(
    @Query('lowStockThreshold', new DefaultValuePipe(5), ParseIntPipe)
    lowStockThreshold: number,
  ) {
    return this.stockService.getStockAlerts(lowStockThreshold);
  }

  @Get(':id')
  getStockDetail(@Param() params: StockIdDto) {
    return this.stockService.getStockDetail(params.id);
  }

  @Patch(':id')
  updateStock(@Param() params: StockIdDto, @Body() dto: UpdateStockDto) {
    return this.stockService.updateStock(params.id, dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(ErrorResponse.badRequest('No file uploaded'));
    }
    const result = await this.stockService.importStockFromExcel(file.buffer);
    return new SuccessResponse(result, result.success ? 'Import successfully!' : 'Import completed with errors');
  }

  @Get('export/excel')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.stockService.exportStockToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-export.xlsx');
    res.send(buffer);
  }
}
