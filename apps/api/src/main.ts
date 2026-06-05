import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so Next.js frontend (port 3000) can smoothly call our API
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // CRITICAL: Changing target port from default 3000 to 3001
  await app.listen(3001);
  console.log(`====================================================`);
  console.log(`🚀 NESTJS CORE ENGINE RUNNING ON: http://localhost:3001`);
  console.log(`====================================================`);
}
bootstrap();