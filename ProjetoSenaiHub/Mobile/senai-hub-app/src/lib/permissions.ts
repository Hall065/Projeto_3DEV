import type { UserRole } from '@/constants/roles';
import { ROLE_APPLICATION_ACCESS } from '@/constants/roles';
import type { HubUsuario, UsuarioAplicacao } from '@/types/auth.types';

export function canAccessConnect(perfil: HubUsuario, aplicacoes: UsuarioAplicacao[]): boolean {
  if (hasApplication(aplicacoes, 'senai_connect')) return true;
  return ROLE_APPLICATION_ACCESS[perfil.tipo as UserRole]?.connect ?? false;
}

export function canAccessGrid(perfil: HubUsuario, aplicacoes: UsuarioAplicacao[]): boolean {
  if (hasApplication(aplicacoes, 'senai_grid')) return true;
  return ROLE_APPLICATION_ACCESS[perfil.tipo as UserRole]?.grid ?? false;
}

export function hasApplication(aplicacoes: UsuarioAplicacao[], codigo: string): boolean {
  return aplicacoes.some((a) => a.aplicacao_codigo === codigo);
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin' || role === 'secretaria' || role === 'direcao';
}

export function canApprovePurchase(role: UserRole, valor: number): boolean {
  if (role === 'admin' || role === 'direcao') return true;
  if (role === 'secretaria' && valor <= 500) return true;
  return false;
}
