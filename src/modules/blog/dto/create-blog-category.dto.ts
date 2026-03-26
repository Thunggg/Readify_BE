import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlogCategoryDto {
  @ApiProperty({ description: 'Tên danh mục blog' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Đường dẫn slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'URL hoặc tên icon' })
  @IsOptional()
  @IsString()
  icon?: string;
}
