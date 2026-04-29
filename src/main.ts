import { validationExceptionFactory } from './common.validation';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './api-exception.filter';
import {
  getCorsOrigins,
  getRateLimitAuthMaxRequests,
  getRateLimitCleanupIntervalMs,
  getRateLimitMaxRequests,
  getRateLimitWindowMs,
  isProductionEnv,
  validateProductionEnv,
} from './env';

type RequestBucket = { count: number; resetAt: number };
const requestBuckets = new Map<string, RequestBucket>();

function applyBasicSecurityHeaders(app: any) {
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    if (isProductionEnv()) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
}

function startRateLimitCleanup() {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of requestBuckets.entries()) {
      if (value.resetAt <= now) requestBuckets.delete(key);
    }
  };

  cleanup();
  const timer = setInterval(cleanup, getRateLimitCleanupIntervalMs());
  timer.unref?.();
}

function applyRateLimit(app: any) {
  const windowMs = getRateLimitWindowMs();
  const maxRequests = getRateLimitMaxRequests();
  const authMaxRequests = getRateLimitAuthMaxRequests();

  app.use((req: any, res: any, next: () => void) => {
    const now = Date.now();
    const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0]?.trim();
    const ip = forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown';
    const isAuthPath =
      String(req.path || '').includes('/auth/login') ||
      String(req.path || '').includes('/auth/register') ||
      String(req.path || '').includes('/auth/forgot-password') ||
      String(req.path || '').includes('/auth/reset-password');

    const limit = isAuthPath ? authMaxRequests : maxRequests;
    const key = `${ip}:${req.method}:${req.path}`;
    const bucket = requestBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - 1)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    if (bucket.count >= limit) {
      res.setHeader(
        'Retry-After',
        String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
      );
      return res.status(429).json({
        message: 'Слишком много запросов. Повторите позже.',
      });
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    next();
  });
}

async function bootstrap() {
  validateProductionEnv();

  const app: any = await NestFactory.create(AppModule, { cors: false });

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiExceptionFilter());

  applyBasicSecurityHeaders(app);
  applyRateLimit(app);
  startRateLimitCleanup();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // 🔥 ВАЖНО: health check для Render
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.status(200).send('OK');
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`Server started on port ${port}. API path: /api`);
}

bootstrap();