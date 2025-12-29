import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { SearchStaffDto } from './dto/search-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { StaffIdDto } from './dto/staff-id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AccountRole } from './constants/staff.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ADMIN)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getList(@Query() query: SearchStaffDto) {
    return this.staffService.getStaffList(query);
  }

  @Get(':id')
  getStaffDetail(@Param() params: StaffIdDto) {
    return this.staffService.getStaffDetail(params.id);
  }

  @Post()
  addStaff(@Body() dto: CreateStaffDto) {
    return this.staffService.addStaff(dto);
  }

  @Patch(':id')
  editStaff(@Param() params: StaffIdDto, @Body() dto: UpdateStaffDto) {
    return this.staffService.editStaff(params.id, dto);
  }

  @Delete(':id')
  deleteStaff(@Param() params: StaffIdDto) {
    return this.staffService.deleteStaff(params.id);
  }

  @Patch(':id/restore')
  restoreStaff(@Param() params: StaffIdDto) {
    return this.staffService.restoreStaff(params.id);
  }

  @Patch(':id/status')
  updateStaffStatus(@Param() params: StaffIdDto, @Body() dto: UpdateStaffStatusDto) {
    return this.staffService.updateStaffStatus(params.id, dto);
  }

  @Patch(':id/role')
  updateStaffRole(@Param() params: StaffIdDto, @Body() dto: UpdateStaffRoleDto) {
    return this.staffService.updateStaffRole(params.id, dto);
  }
}
