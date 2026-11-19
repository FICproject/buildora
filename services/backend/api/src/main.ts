import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for customer-web and development origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[BUILDORA 60 API] Backend service successfully running on http://localhost:${port}`);
  console.log(`[BUILDORA 60 API] Health Check: http://localhost:${port}/api/v1/health`);
  console.log(`[BUILDORA 60 API] Products API: http://localhost:${port}/api/v1/products`);
  if (process.env.MONGODB_URI) {
    const maskedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`[BUILDORA 60 API] MongoDB URI Configured: ${maskedUri}`);
  }
}

bootstrap();
