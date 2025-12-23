import { Controller, Get, Param } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async list() {
    return this.stockService.findAll();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.stockService.findOne(id);
  }
}
