import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, Max, Min } from 'class-validator';

export class TrendingRecommendationsDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  limit?: number = 8;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeWebData?: boolean = true;
}
