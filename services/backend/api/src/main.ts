import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const candidateEnvPaths = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '..', '.env'),
  path.resolve(process.cwd(), 'services/backend/api/.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function buildAllowedOriginChecker() {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const staticAllowed = new Set<string>([
    'https://buildora-jtns.vercel.app',
    'https://buildora-vendor.vercel.app',
    'https://buildora-customer.vercel.app',
    ...configured
  ]);

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser requests (curl, health checks, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (staticAllowed.has(origin)) {
      return callback(null, true);
    }

    // Allow localhost / 127.0.0.1 dev servers on any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }

    // Allow approved Vercel & Render HTTPS deployments for BUILDORA 60
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) || /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Enable strict origin-aware CORS with credentials and OPTIONS preflight support
  app.enableCors({
    origin: buildAllowedOriginChecker(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-Tenant-ID',
      'x-tenant-id',
      'idempotency-key',
      'Idempotency-Key',
      'x-admin-key',
      'x-admin-id',
      'x-refresh-token',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Content-Disposition', 'X-Request-Id'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
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
  const rzpKey = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const rzpMode = rzpKey.startsWith('rzp_test_') ? 'TEST_MODE' : rzpKey.startsWith('rzp_live_') ? 'LIVE_MODE' : 'UNCONFIGURED';
  console.log(`[BUILDORA 60 API] Razorpay Status: ${rzpMode}${rzpKey ? ` (${rzpKey.slice(0, 12)}..., secret=${rzpSecret ? 'SET' : 'MISSING'})` : ''}`);
}

bootstrap();
