export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export type InputMask =
  | 'cpf'
  | 'cnpj'
  | 'phone'
  | 'date'
  | 'time'
  | 'month'
  | 'currency'
  | 'decimal'
  | 'integer';

type MaskableField = {
  name: string;
  label?: string;
  keyboardType?: string;
  mask?: InputMask;
};

export function onlyDigits(value: string): string {
  return `${value ?? ''}`.replace(/\D/g, '');
}

function limit(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}

export function formatCpf(cpf: string): string {
  const digits = limit(onlyDigits(cpf), 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatCnpj(cnpj: string): string {
  const digits = limit(onlyDigits(cnpj), 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatPhone(phone: string): string {
  const digits = limit(onlyDigits(phone), 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  const firstPartLength = digits.length <= 10 ? 4 : 5;
  const firstPart = number.slice(0, firstPartLength);
  const secondPart = number.slice(firstPartLength);

  if (!secondPart) {
    return `(${areaCode}) ${firstPart}`;
  }
  return `(${areaCode}) ${firstPart}-${secondPart}`;
}

export function formatDateBR(value: string): string {
  const isoMatch = `${value ?? ''}`.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const digits = limit(onlyDigits(value), 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatTime(value: string): string {
  const digits = limit(onlyDigits(value), 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function formatMonthBR(value: string): string {
  const isoMatch = `${value ?? ''}`.match(/^(\d{4})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[2]}/${isoMatch[1]}`;

  const digits = limit(onlyDigits(value), 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatIntegerInput(value: string): string {
  return onlyDigits(value);
}

export function formatDecimalInput(value: string, maxDecimals = 2): string {
  const normalized = normalizeDecimalInput(value, maxDecimals);
  if (!normalized) return '';

  const [integerPart, decimalPart] = normalized.split('.');
  if (decimalPart === undefined) {
    return integerPart;
  }
  return `${integerPart},${decimalPart}`;
}

export function formatCurrencyInput(value: string): string {
  return formatDecimalInput(value, 2);
}

export function normalizeDateToIso(value: string): string {
  const raw = `${value ?? ''}`.trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  const digits = onlyDigits(raw);
  if (digits.length === 8) {
    return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }
  return raw;
}

export function normalizeMonthToIso(value: string): string {
  const raw = `${value ?? ''}`.trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;

  const match = raw.match(/^(\d{2})\/(\d{4})$/);
  if (match) return `${match[2]}-${match[1]}`;

  const digits = onlyDigits(raw);
  if (digits.length === 6) {
    return `${digits.slice(2)}-${digits.slice(0, 2)}`;
  }
  return raw;
}

export function normalizeDecimalInput(value: string, maxDecimals = 2): string {
  const raw = `${value ?? ''}`.trim();
  if (!raw) return '';

  const cleaned = raw.replace(/[^\d,.]/g, '');
  if (!cleaned) return '';

  const hasComma = cleaned.includes(',');
  const decimalSeparator = hasComma ? ',' : cleaned.includes('.') ? '.' : '';

  if (!decimalSeparator) {
    return onlyDigits(cleaned);
  }

  if (!hasComma && decimalSeparator === '.') {
    const dotParts = cleaned.split('.');
    const lastPart = dotParts[dotParts.length - 1] ?? '';
    if (dotParts.length > 1 && lastPart.length === 3) {
      return onlyDigits(cleaned);
    }
  }

  const parts = cleaned.split(decimalSeparator);
  const decimalPart = onlyDigits(parts.pop() ?? '').slice(0, maxDecimals);
  const integerPart = onlyDigits(parts.join('')) || '0';

  if (!decimalPart && cleaned.endsWith(decimalSeparator)) {
    return `${integerPart}.`;
  }
  if (!decimalPart) return integerPart;
  return `${integerPart}.${decimalPart}`;
}

export function resolveInputMask(field: MaskableField): InputMask | undefined {
  if (field.mask) return field.mask;

  const name = field.name.toLowerCase();
  const label = field.label?.toLowerCase() ?? '';
  const identity = `${name} ${label}`;

  if (name === 'cpf' || name.endsWith('_cpf')) return 'cpf';
  if (name === 'cnpj' || name.endsWith('_cnpj')) return 'cnpj';
  if (identity.includes('telefone') || identity.includes('celular') || name.includes('phone')) return 'phone';
  if (name === 'mes_referencia') return 'month';
  if (name.startsWith('data_') || name.endsWith('_data')) return 'date';
  if (name.startsWith('horario_') || identity.includes('horario') || identity.includes('horário')) return 'time';
  if (name.includes('salario') || name.includes('valor') || name.includes('custo') || name.includes('preco')) {
    return 'currency';
  }
  if (name.includes('quantidade') || name.includes('dias_uteis')) return 'integer';
  if (field.keyboardType === 'numeric') return 'decimal';

  return undefined;
}

export function applyInputMask(field: MaskableField, value: string): string {
  const mask = resolveInputMask(field);
  switch (mask) {
    case 'cpf':
      return formatCpf(value);
    case 'cnpj':
      return formatCnpj(value);
    case 'phone':
      return formatPhone(value);
    case 'date':
      return formatDateBR(value);
    case 'time':
      return formatTime(value);
    case 'month':
      return formatMonthBR(value);
    case 'currency':
      return formatCurrencyInput(value);
    case 'decimal':
      return formatDecimalInput(value);
    case 'integer':
      return formatIntegerInput(value);
    default:
      return value;
  }
}

export function normalizeInputValue(field: MaskableField, value: string): string {
  const mask = resolveInputMask(field);
  switch (mask) {
    case 'cpf':
    case 'cnpj':
    case 'phone':
    case 'integer':
      return onlyDigits(value);
    case 'date':
      return normalizeDateToIso(value);
    case 'month':
      return normalizeMonthToIso(value);
    case 'currency':
    case 'decimal':
      return normalizeDecimalInput(value);
    default:
      return value;
  }
}

export function isMaskedValueComplete(field: MaskableField, value: string): boolean {
  const raw = `${value ?? ''}`.trim();
  if (!raw) return true;

  const mask = resolveInputMask(field);
  switch (mask) {
    case 'cpf':
      return onlyDigits(raw).length === 11;
    case 'cnpj':
      return onlyDigits(raw).length === 14;
    case 'phone':
      return [10, 11].includes(onlyDigits(raw).length);
    case 'date':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(raw) || /^\d{4}-\d{2}-\d{2}$/.test(raw);
    case 'time':
      return /^\d{2}:\d{2}$/.test(raw);
    case 'month':
      return /^\d{2}\/\d{4}$/.test(raw) || /^\d{4}-\d{2}$/.test(raw);
    default:
      return true;
  }
}

export function formatInitialFormValues<T extends MaskableField>(
  values: Record<string, string> | undefined,
  fields: T[]
): Record<string, string> {
  const formatted = { ...(values ?? {}) };
  fields.forEach((field) => {
    formatted[field.name] = applyInputMask(field, formatted[field.name] ?? '');
  });
  return formatted;
}

export function normalizeFormValues<T extends MaskableField>(
  values: Record<string, string>,
  fields: T[]
): Record<string, string> {
  const normalized = { ...values };
  fields.forEach((field) => {
    normalized[field.name] = normalizeInputValue(field, normalized[field.name] ?? '');
  });
  return normalized;
}

export function getKeyboardTypeForMask(mask?: InputMask) {
  switch (mask) {
    case 'cpf':
    case 'cnpj':
    case 'phone':
      return 'phone-pad';
    case 'date':
    case 'time':
    case 'month':
    case 'integer':
      return 'numeric';
    case 'currency':
    case 'decimal':
      return 'decimal-pad';
    default:
      return 'default';
  }
}
