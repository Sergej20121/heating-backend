import { Controller, Get, Header } from '@nestjs/common';
function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
@Controller()
export class PublicController {
  @Get('privacy-policy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPrivacyPolicy() {
    const company = escapeHtml(process.env.PRIVACY_POLICY_COMPANY?.trim() || 'Оператор приложения');
    const email = escapeHtml(process.env.PRIVACY_POLICY_EMAIL?.trim() || 'support@example.ru');
    const address = escapeHtml(process.env.PRIVACY_POLICY_ADDRESS?.trim() || 'Российская Федерация');
    const updatedAt = new Date().toISOString().slice(0, 10);
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Политика конфиденциальности</title><style>body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111827;background:#fff}main{max-width:900px;margin:0 auto;line-height:1.6}h1,h2{color:#0f172a}.meta{color:#475569;margin-bottom:24px}</style></head><body><main><h1>Политика конфиденциальности</h1><p class="meta">Дата обновления: ${updatedAt}</p><p>${company} обрабатывает персональные данные пользователей приложения для предоставления доступа к лицевому счёту, показаниям счётчиков, начислениям, обращениям и уведомлениям.</p><h2>Какие данные обрабатываются</h2><p>Номер телефона, адрес, номер договора, сведения по показаниям счётчиков, начислениям и обращениям, а также технические данные, необходимые для работы сервиса.</p><h2>Цели обработки</h2><p>Регистрация и авторизация в приложении, обработка показаний, формирование начислений, обратная связь с пользователем, отправка уведомлений и исполнение требований законодательства РФ.</p><h2>Передача и хранение</h2><p>Данные хранятся на защищённых серверах и не передаются третьим лицам без законных оснований, кроме случаев, прямо предусмотренных законодательством РФ.</p><h2>Права пользователя</h2><p>Пользователь может запросить уточнение, обновление или удаление своих данных, если это не противоречит требованиям закона и обязательствам по договору.</p><h2>Контакты оператора</h2><p>Email: ${email}<br/>Адрес: ${address}</p></main></body></html>`;
  }
}
