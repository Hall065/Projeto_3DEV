import type { UserRole } from '@/constants/roles';

export interface HubUsuario {
  id: string;
  nome: string;
  email_institucional: string;
  tipo: UserRole;
  status: 'ativo' | 'inativo' | 'bloqueado';
  telefone?: string | null;
  cpf?: string | null;
  foto_arquivo_id?: string | null;
  foto_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioAplicacao {
  id: string;
  usuario_id: string;
  aplicacao_id: string;
  aplicacao_codigo?: string;
  aplicacao_nome?: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  perfil: HubUsuario | null;
  aplicacoes: UsuarioAplicacao[];
}
