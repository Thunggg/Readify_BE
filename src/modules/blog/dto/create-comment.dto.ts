import { IsString, IsEmail, IsMongoId, IsOptional, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(3)
  authorName: string;

  @IsEmail()
  authorEmail: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;
}
