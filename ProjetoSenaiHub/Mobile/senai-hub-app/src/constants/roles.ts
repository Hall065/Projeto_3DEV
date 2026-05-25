export const USER_ROLES = [
  'admin',
  'aluno',
  'professor',
  'secretaria',
  'direcao',
  'empresa',
  'manutencao',
  'gerente_manutencao',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const APPLICATIONS = {
  HUB: 'senai_hub',
  CONNECT: 'senai_connect',
  GRID: 'senai_grid',
} as const;

export type ApplicationCode = (typeof APPLICATIONS)[keyof typeof APPLICATIONS];

export const ROLE_APPLICATION_ACCESS: Record<
  UserRole,
  { hub: boolean; connect: boolean; grid: boolean }
> = {
  admin: { hub: true, connect: true, grid: true },
  direcao: { hub: true, connect: true, grid: true },
  secretaria: { hub: true, connect: true, grid: true },
  professor: { hub: true, connect: true, grid: true },
  aluno: { hub: true, connect: false, grid: false },
  empresa: { hub: true, connect: true, grid: false },
  manutencao: { hub: true, connect: false, grid: true },
  gerente_manutencao: { hub: true, connect: false, grid: true },
};
