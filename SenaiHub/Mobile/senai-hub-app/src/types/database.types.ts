export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  hub: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nome: string;
          email_institucional: string;
          tipo: string;
          status: string;
          telefone: string | null;
          cpf: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['hub']['Tables']['usuarios']['Row']>;
        Update: Partial<Database['hub']['Tables']['usuarios']['Row']>;
      };
      aplicacoes: {
        Row: { id: string; codigo: string; nome: string; descricao: string | null };
      };
      usuario_aplicacoes: {
        Row: { id: string; usuario_id: string; aplicacao_id: string };
      };
      arquivos: {
        Row: {
          id: string;
          url_segura: string;
          public_id: string;
          tipo_arquivo: string;
          tamanho_bytes: number | null;
          enviado_por: string;
        };
      };
      notificacoes: {
        Row: {
          id: string;
          usuario_id: string;
          titulo: string;
          mensagem: string;
          lida: boolean;
          created_at: string;
        };
      };
    };
  };
}
