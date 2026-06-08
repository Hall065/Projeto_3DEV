export const MOBILE_USER_ROLES = [
  'admin',
  'aluno',
  'professor',
  'secretaria',
  'direcao',
  'empresa',
  'manutencao',
  'gerente_manutencao',
] as const;

export const WEB_USER_ROLES = [
  'connect_professor',
  'connect_secretaria',
  'connect_aqv',
  'connect_empresa',
  'connect_aluno',
  'grid_chefe',
  'grid_funcionario',
] as const;

export const USER_ROLES = [...MOBILE_USER_ROLES, ...WEB_USER_ROLES] as const;

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
  secretaria: { hub: true, connect: true, grid: false },
  professor: { hub: true, connect: true, grid: true },
  aluno: { hub: true, connect: false, grid: false },
  empresa: { hub: true, connect: true, grid: false },
  manutencao: { hub: true, connect: false, grid: true },
  gerente_manutencao: { hub: true, connect: false, grid: true },
  connect_professor: { hub: true, connect: true, grid: false },
  connect_secretaria: { hub: true, connect: true, grid: false },
  connect_aqv: { hub: true, connect: true, grid: false },
  connect_empresa: { hub: true, connect: true, grid: false },
  connect_aluno: { hub: true, connect: false, grid: false },
  grid_chefe: { hub: true, connect: false, grid: true },
  grid_funcionario: { hub: true, connect: false, grid: true },
};
