import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateProfileDto } from './update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        fullAddress: true,
        contractNumber: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async getByPhone(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        fullAddress: true,
        contractNumber: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullAddress: dto.fullAddress ?? user.fullAddress,
        contractNumber: dto.contractNumber ?? user.contractNumber,
      },
      select: {
        id: true,
        phone: true,
        fullAddress: true,
        contractNumber: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
