import { BadRequestException, ValidationError } from '@nestjs/common';

function prettifyProperty(property: string): string {
  const map: Record<string, string> = {
    phone: 'Телефон',
    password: 'Пароль',
    confirmPassword: 'Подтверждение пароля',
    fullAddress: 'Адрес',
    contractNumber: 'Номер договора',
    code: 'Код подтверждения',
    oldPassword: 'Старый пароль',
    newPassword: 'Новый пароль',
    meterId: 'Счётчик',
    value: 'Показание',
    title: 'Заголовок',
    body: 'Текст',
    serialNumber: 'Серийный номер',
    type: 'Тип',
    preferredDate: 'Предпочтительная дата',
    reason: 'Причина',
    comment: 'Комментарий',
    status: 'Статус',
  };
  return map[property] || property;
}

function translateConstraint(message: string, property: string): string {
  const field = prettifyProperty(property);
  const text = message.trim();
  const lower = text.toLowerCase();

  if (lower.includes('should not be empty') || lower.includes('should not be null or undefined')) {
    return `Поле «${field}» обязательно для заполнения.`;
  }
  if (lower.includes('must be shorter than or equal to')) {
    const match = text.match(/(\d+)/);
    return `Поле «${field}» должно содержать не более ${match?.[1] || ''} символов.`.replace('  ', ' ');
  }
  if (lower.includes('must be longer than or equal to') || lower.includes('must be at least')) {
    const match = text.match(/(\d+)/);
    return `Поле «${field}» должно содержать не менее ${match?.[1] || ''} символов.`.replace('  ', ' ');
  }
  if (lower.includes('must be a string')) {
    return `Поле «${field}» должно быть строкой.`;
  }
  if (lower.includes('must be an integer number')) {
    return `Поле «${field}» должно быть целым числом.`;
  }
  if (lower.includes('must not be less than')) {
    const match = text.match(/(\d+)/);
    return `Поле «${field}» должно быть не меньше ${match?.[1] || ''}.`.replace('  ', ' ');
  }
  if (lower.includes('must be one of the following values')) {
    const match = text.match(/following values: (.+)$/i);
    return `Поле «${field}» содержит недопустимое значение.${match?.[1] ? ` Допустимые значения: ${match[1]}.` : ''}`;
  }
  if (lower.includes('must be a valid iso 8601 date string')) {
    return `Поле «${field}» должно содержать корректную дату.`;
  }
  if (lower.includes('must match')) {
    return `Поле «${field}» должно содержать корректный номер телефона.`;
  }
  if (lower.includes('must be a phone number')) {
    return `Поле «${field}» должно содержать корректный номер телефона.`;
  }
  if (lower.includes('must be') || lower.includes('should be')) {
    return `Поле «${field}» заполнено некорректно.`;
  }

  return text;
}

function collectMessages(errors: ValidationError[], parent?: string): string[] {
  const result: string[] = [];

  for (const error of errors) {
    const property = parent ? `${parent}.${error.property}` : error.property;

    if (error.constraints) {
      for (const value of Object.values(error.constraints)) {
        result.push(translateConstraint(String(value), error.property));
      }
    }

    if (error.children?.length) {
      result.push(...collectMessages(error.children, property));
    }
  }

  return result;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  const messages = collectMessages(errors).filter(Boolean);
  throw new BadRequestException(messages.length ? messages : ['Данные заполнены некорректно.']);
}
