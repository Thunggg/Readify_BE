import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ValidationError } from 'class-validator';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        //https://stackoverflow.com/questions/75581669/customize-error-message-in-nest-js-using-class-validator
        const details = validationErrors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints ?? {}).join(', '),
        }));

        return new BadRequestException(new ErrorResponse('Validation Error', 'VALIDATION_ERROR', 400, details));
      },
    }),
  );

  app.enableCors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.use(cookieParser()); // ✅ OK

  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('port') ?? 3000);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Readify API')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
}
void bootstrap();
