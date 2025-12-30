import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SearchSupplierDto } from './dto/search-supplier.dto';
import { SupplierIdDto } from './dto/supplier-id.dto';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  getList(@Query() query: SearchSupplierDto) {
    return this.supplierService.getSupplierList(query);
  }

  @Get('search')
  searchSuppliers(@Query() query: SearchSupplierDto) {
    return this.supplierService.getSupplierList(query);
  }

  @Get(':id')
  getSupplierDetail(@Param() params: SupplierIdDto) {
    return this.supplierService.getSupplierDetail(params.id);
  }

  @Post()
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.supplierService.createSupplier(dto);
  }

  @Patch(':id')
  updateSupplier(@Param() params: SupplierIdDto, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.updateSupplier(params.id, dto);
  }

  @Delete(':id')
  deleteSupplier(@Param() params: SupplierIdDto) {
    return this.supplierService.deleteSupplier(params.id);
  }

  @Patch(':id/restore')
  restoreSupplier(@Param() params: SupplierIdDto) {
    return this.supplierService.restoreSupplier(params.id);
  }
}
