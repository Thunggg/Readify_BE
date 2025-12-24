import { Controller, Get, Query ,Param} from '@nestjs/common';
import { StaffService } from './staff.service';
import { SearchStaffDto } from './dto/search-staff.dto';
import { StaffIdDto } from './dto/staff-id.dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  getList(@Query() query: SearchStaffDto) {
    return this.staffService.getStaffList(query);
  }

  @Get(':id')
  getStaffDetail(@Param() params: StaffIdDto) {
    return this.staffService.getStaffDetail(params.id);
  }
}
