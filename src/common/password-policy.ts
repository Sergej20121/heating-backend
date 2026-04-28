import { BadRequestException } from '@nestjs/common';

export function validatePasswordOrThrow(password: string) {
  const value = String(password || '');
  if (value.length < 8) {
    throw new BadRequestException('Пароль должен содержать не менее 8 символов');
  }
  if (!/[A-Za-zА-Яа-я]/.test(value) || !/\d/.test(value)) {
    throw new BadRequestException('Пароль должен содержать хотя бы одну букву и одну цифру');
  }
}
