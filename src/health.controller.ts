import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      mode: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      apiPrefix: '/api',
    };
  }
}
