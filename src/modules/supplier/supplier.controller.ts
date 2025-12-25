import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ApiResponse } from '../../shared/responses/api-response';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  async list() {
    const items = await this.supplierService.findAll();
    return ApiResponse.success(items);
  }

  @Get('search')
  async search(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, Number(page ?? 1));
    const l = Math.max(1, Number(limit ?? 10));
    const { items, total } = await this.supplierService.search(q, p, l);
    if (!total || total === 0) {
      return ApiResponse.error('No suppliers found', 'NOT_FOUND', 404);
    }
    return ApiResponse.paginated(items, { page: p, limit: l, total }, 'Search results');
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const item = await this.supplierService.findOne(id);
    return ApiResponse.success(item);
  }

  @Post()
  async create(@Body() dto: CreateSupplierDto) {
    const created = await this.supplierService.create(dto);
    return ApiResponse.success(created, 'Supplier created', 201);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    const updated = await this.supplierService.update(id, dto);
    return ApiResponse.success(updated, 'Supplier updated');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const res = await this.supplierService.remove(id);
    return ApiResponse.success(res, 'Supplier deleted');
  }
}
