import { plainToInstance } from 'class-transformer';
import { IsString, validateSync, IsOptional } from 'class-validator';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
config({
  path: '.env',
});

if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Environment file not found');
  process.exit(1);
}

class ConfigSchema {
  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  MONGO_URI?: string;

  @IsOptional()
  @IsString()
  ACCESS_TOKEN_SECRET?: string;

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_SECRET?: string;

  @IsOptional()
  @IsString()
  ACCESS_TOKEN_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_EXPIRES_IN?: string;
}
const configServer = plainToInstance(ConfigSchema, process.env);
const e = validateSync(configServer);
if (e.length > 0) {
  console.error('Các giá trị khai báo trong file .env không hợp lệ');
  const errors = e.map((eItem) => {
    return {
      property: eItem.property,
      constraints: eItem.constraints,
      value: eItem.value,
    };
  });
  throw errors;
}

const envConfig = configServer;

export default envConfig;
