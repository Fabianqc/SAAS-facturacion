import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // Habilitar CORS para conectar con el Frontend (Next.js)
  app.enableCors({
    origin: true, // Permite peticiones desde el frontend en dev
    credentials: true,
  });

  // Habilitar validación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en: http://localhost:${port}/api`);
}
bootstrap();
