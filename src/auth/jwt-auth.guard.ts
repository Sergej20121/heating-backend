import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtSecret } from '../env';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Требуется токен авторизации');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Неверный формат заголовка Authorization');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: getJwtSecret(),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Токен недействителен или истёк');
    }
  }
}
