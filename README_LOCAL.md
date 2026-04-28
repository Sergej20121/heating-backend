Локальный запуск бэкенда

1. Установить зависимости:
   npm install
2. Настроить .env на свою локальную PostgreSQL.
3. Сгенерировать Prisma client:
   npx prisma generate
4. Применить миграции:
   npx prisma migrate deploy
   или для локальной разработки:
   npx prisma migrate dev
5. Запуск:
   npm run start:dev

Примечание:
- В проекте оставлен ALLOW_READINGS_ANY_DAY=true для удобного локального тестирования.
- Если PostgreSQL работает не на 5433, поправьте DATABASE_URL.
