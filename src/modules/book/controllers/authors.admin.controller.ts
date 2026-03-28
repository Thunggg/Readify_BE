import { Controller, Get, Query } from '@nestjs/common';
import { AuthorsAdminService } from '../services/authors.admin.service';
import { SearchAuthorsDto } from '../dto/search-authors.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authors (Admin)')
@Controller('admin/authors')
export class AuthorsAdminController {
  constructor(private readonly authorsAdminService: AuthorsAdminService) {}

  @Get()
  getAuthorList(@Query() query: SearchAuthorsDto) {
    return this.authorsAdminService.getAuthorList(query);
  }
}
