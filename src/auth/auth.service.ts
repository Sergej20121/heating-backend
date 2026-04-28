import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto.register';
import { RegisterAdminDto } from './dto.register-admin';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { OtpPurpose, UserRole, UserStatus } from '@prisma/client';
import { canLogOtpToConsole, getOtpCooldownSeconds, getOtpHourlyLimit, getOtpMaxAttempts } from '../env';
import { validatePasswordOrThrow } from '../common/password-policy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private generateCode() {
    return randomInt(100000, 1000000).toString();
  }

  private async ensureOtpLimit(phone: string, purpose: OtpPurpose) {
    const cooldownSeconds = getOtpCooldownSeconds();
    const hourlyLimit = getOtpHourlyLimit();
    const cooldownBorder = new Date(Date.now() - cooldownSeconds * 1000);
    const hourBorder = new Date(Date.now() - 60 * 60 * 1000);

    const [recentOtp, otpInHour] = await Promise.all([
      this.prisma.otpCode.findFirst({
        where: { phone, purpose, createdAt: { gte: cooldownBorder } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.otpCode.count({
        where: { phone, purpose, createdAt: { gte: hourBorder } },
      }),
    ]);

    if (recentOtp) {
      throw new BadRequestException(`Повторный запрос кода возможен через ${cooldownSeconds} сек.`);
    }

    if (otpInHour >= hourlyLimit) {
      throw new BadRequestException('Превышен лимит запросов кода. Попробуйте позже');
    }
  }

  private async logOtp(phone: string, code: string, label: string) {
    if (canLogOtpToConsole()) {
      console.log(`${label} for ${phone}: ${code}`);
    }
  }


  private async consumeOtpOrThrow(phone: string, code: string, purpose: OtpPurpose) {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Код не найден');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('Код истёк');
    }

    const maxAttempts = getOtpMaxAttempts();
    if (otp.attempts >= maxAttempts) {
      throw new BadRequestException('Код заблокирован из-за большого количества неверных попыток. Запросите новый код.');
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Неверный код');
    }

    return this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    validatePasswordOrThrow(dto.password);

    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (exists) {
      throw new BadRequestException('Пользователь уже существует');
    }

    await this.ensureOtpLimit(dto.phone, OtpPurpose.REGISTER);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        fullAddress: dto.fullAddress,
        contractNumber: dto.contractNumber,
        status: UserStatus.PENDING,
        role: UserRole.USER,
      },
    });

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);

    const ttlMinutes = Number(process.env.SMS_CODE_TTL_MINUTES || 5);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        phone: dto.phone,
        codeHash,
        purpose: OtpPurpose.REGISTER,
        expiresAt,
        userId: user.id,
      },
    });

    await this.logOtp(dto.phone, code, 'SMS code');

    return {
      message: canLogOtpToConsole()
        ? 'Пользователь создан. Код подтверждения выведен в консоль сервера.'
        : 'Пользователь создан. Код подтверждения отправлен.',
    };
  }

  async registerAdmin(dto: RegisterAdminDto) {
    const adminRegistrationEnabled = ['1', 'true', 'yes'].includes(String(process.env.ADMIN_REGISTRATION_ENABLED || '').toLowerCase());
    if (process.env.NODE_ENV === 'production' || !adminRegistrationEnabled) {
      throw new ForbiddenException('Регистрация администратора отключена. Создайте администратора вручную через защищённую процедуру.');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Пароли не совпадают');
    }

    validatePasswordOrThrow(dto.password);

    const expectedAdminCode = process.env.ADMIN_REGISTRATION_CODE;
    if (!expectedAdminCode) {
      throw new BadRequestException('ADMIN_REGISTRATION_CODE не задан в .env');
    }

    if (dto.adminCode !== expectedAdminCode) {
      throw new UnauthorizedException('Неверный код регистрации администратора');
    }

    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (exists) {
      throw new BadRequestException('Пользователь уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        fullAddress: dto.fullAddress,
        contractNumber: dto.contractNumber,
        status: UserStatus.ACTIVE,
        role: UserRole.ADMIN,
      },
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      message: 'Администратор успешно зарегистрирован',
      accessToken: token,
    };
  }

  async verifyPhone(phone: string, code: string) {
    const otp = await this.consumeOtpOrThrow(phone, code, OtpPurpose.REGISTER);

    const user = await this.prisma.user.update({
      where: { phone },
      data: { status: UserStatus.ACTIVE },
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      message: 'Телефон подтверждён',
      accessToken: token,
    };
  }

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Аккаунт заблокирован. Обратитесь в поддержку.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Телефон не подтверждён');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      accessToken: token,
    };
  }

  async forgotPassword(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    await this.ensureOtpLimit(phone, OtpPurpose.RESET_PASSWORD);

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const ttlMinutes = Number(process.env.SMS_CODE_TTL_MINUTES || 5);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        purpose: OtpPurpose.RESET_PASSWORD,
        expiresAt,
        userId: user.id,
      },
    });

    await this.logOtp(phone, code, 'Reset code');

    return {
      message: canLogOtpToConsole()
        ? 'Код для сброса пароля выведен в консоль сервера.'
        : 'Код для сброса пароля отправлен.',
    };
  }

  async resetPassword(phone: string, code: string, newPassword: string) {
    validatePasswordOrThrow(newPassword);

    const otp = await this.consumeOtpOrThrow(phone, code, OtpPurpose.RESET_PASSWORD);

    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { phone },
      data: { passwordHash: newHash },
    });

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });

    return {
      message: 'Пароль успешно изменён',
      accessToken: token,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    validatePasswordOrThrow(newPassword);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Старый пароль неверный');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return {
      message: 'Пароль успешно изменён',
    };
  }
}