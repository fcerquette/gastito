import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Trust the Render/proxy in front so req.secure refleja el HTTPS real
  // y las cookies con `secure: true` se aceptan en producción.
  if (config.get<string>('NODE_ENV') === 'production') {
    app.set('trust proxy', 1);
  }

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Gastito API listening on http://localhost:${port}/api`);
}
bootstrap();
