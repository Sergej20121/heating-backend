Запуск backend в production для RuStore

1. Скопируйте .env.production.example в .env.production и заполните значения
2. Проверьте CORS_ORIGINS
3. Выполните npm install, npm run prisma:generate, npx prisma migrate deploy
4. При необходимости создайте администратора: SEED_ADMIN_PHONE=79990000000 SEED_ADMIN_PASSWORD=StrongPass123 npm run seed
5. Сборка и запуск: npm run build && NODE_ENV=production node dist/main.js
Адреса: /api/health и /privacy-policy


## Production hardening added in final archive

- Admin self-registration is disabled in production. `POST /auth/register-admin` works only when `ADMIN_REGISTRATION_ENABLED=true` and `NODE_ENV` is not `production`.
- Dangerous local maintenance scripts (`make-admin.js`, `fix-user.js`, `fix-announcement.js`) were removed from the release archive.
- Global in-memory rate limit middleware is enabled. Tune with `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_AUTH_MAX_REQUESTS`.
- Equal meter readings are rejected: a new value must be strictly greater than the previous value.
- Before public launch, replace all example secrets, enable HTTPS, and run `npx prisma migrate deploy`.
