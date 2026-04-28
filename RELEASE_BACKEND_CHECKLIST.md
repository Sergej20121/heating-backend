# Backend release checklist

1. Скопируй `.env.production.example` в `.env.production` и замени все заглушки.
2. В production backend сам остановится, если:
   - `JWT_SECRET` короткий или заглушка;
   - `DATABASE_URL` указывает на localhost/заглушку;
   - `CORS_ORIGINS` не HTTPS;
   - включена регистрация администратора;
   - включён вывод SMS-кодов в консоль.
3. Установи зависимости: `npm ci`.
4. Сгенерируй Prisma Client: `npm run prisma:generate`.
5. Собери проект: `npm run build`.
6. Примени миграции: `npm run prisma:deploy`.
7. Создай администратора:
   `ADMIN_PHONE=... ADMIN_PASSWORD=... npm run create-admin:prod`
8. Запусти backend: `NODE_ENV=production node dist/main.js`.
9. Проверь: `GET https://api.your-real-domain.ru/api/health`.
