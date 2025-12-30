import { IsString } from 'class-validator';

export class BookSlugDto {
  @IsString()
  slug: string;
}
