const LOCALHOST_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

function parseBooleanEnv(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseIntEnv(value: string | undefined, fallback: number, min?: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const intValue = Math.floor(parsed);
  if (min !== undefined && intValue < min) return fallback;
  if (max !== undefined && intValue > max) return fallback;
  return intValue;
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in production`);
  return value;
}

function hasUnsafePlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes('change_me') || normalized.includes('replace') || normalized.includes('your-domain') || normalized.includes('your-real-domain') || normalized.includes('example.com') || normalized.includes('localhost') || normalized.includes('127.0.0.1') || normalized.includes('strong_db_password');
}

export function isProductionEnv() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

export function getJwtSecret() {
  const value = process.env.JWT_SECRET?.trim();
  if (value) return value;
  if (!isProductionEnv()) return 'local_dev_jwt_secret_change_me';
  throw new Error('JWT_SECRET is required in production');
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN?.trim() || '7d';
}

export function canLogOtpToConsole() {
  if (isProductionEnv()) return false;
  return parseBooleanEnv(process.env.SMS_DEBUG_TO_CONSOLE, false);
}

export function getOtpCooldownSeconds() {
  return parseIntEnv(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60, 0, 60 * 60);
}

export function getOtpHourlyLimit() {
  return parseIntEnv(process.env.OTP_MAX_PER_HOUR, 5, 1, 100);
}

export function getCorsOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return isProductionEnv() ? [] : LOCALHOST_CORS_ORIGINS;

  const origins = raw.split(',').map((item) => item.trim()).filter(Boolean);
  return origins.length ? origins : isProductionEnv() ? [] : LOCALHOST_CORS_ORIGINS;
}

export function getRateLimitWindowMs() {
  return parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 60_000, 1_000, 60 * 60 * 1000);
}

export function getRateLimitMaxRequests() {
  return parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 180, 10, 50_000);
}

export function getRateLimitAuthMaxRequests() {
  return parseIntEnv(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 20, 3, 1_000);
}

export function getRateLimitCleanupIntervalMs() {
  return parseIntEnv(process.env.RATE_LIMIT_CLEANUP_INTERVAL_MS, 300_000, 30_000, 24 * 60 * 60 * 1000);
}

export function getNotificationBatchSize() {
  return parseIntEnv(process.env.NOTIFICATION_BATCH_SIZE, 500, 50, 10_000);
}

export function getMaxNotificationHistory() {
  return parseIntEnv(process.env.MAX_NOTIFICATION_HISTORY, 200, 20, 1_000);
}

export function getOtpMaxAttempts() {
  return parseIntEnv(process.env.OTP_MAX_ATTEMPTS, 5, 1, 20);
}

export function isMockPaymentsEnabled() {
  return parseBooleanEnv(process.env.ENABLE_MOCK_PAYMENTS, !isProductionEnv());
}

export function validateProductionEnv() {
  if (!isProductionEnv()) return;

  const jwtSecret = requireEnv('JWT_SECRET');
  if (jwtSecret.length < 32 || hasUnsafePlaceholder(jwtSecret)) {
    throw new Error('JWT_SECRET must be a real random value with at least 32 characters in production');
  }

  const databaseUrl = requireEnv('DATABASE_URL');
  if (hasUnsafePlaceholder(databaseUrl)) {
    throw new Error('DATABASE_URL must point to a real production database, not localhost or placeholder value');
  }

  const corsOrigins = getCorsOrigins();
  if (!corsOrigins.length || corsOrigins.some((origin) => hasUnsafePlaceholder(origin) || !origin.startsWith('https://'))) {
    throw new Error('CORS_ORIGINS must contain real https:// production origins');
  }

  if (parseBooleanEnv(process.env.ADMIN_REGISTRATION_ENABLED, false)) {
    throw new Error('ADMIN_REGISTRATION_ENABLED must be disabled in production');
  }

  if (parseBooleanEnv(process.env.SMS_DEBUG_TO_CONSOLE, false)) {
    throw new Error('SMS_DEBUG_TO_CONSOLE must be disabled in production');
  }
}
