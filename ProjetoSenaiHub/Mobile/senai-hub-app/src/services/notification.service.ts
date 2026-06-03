import { supabase } from '@/lib/supabase';

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  lida_em?: string | null;
}

export const notificationService = {
  async listByUser(userId: string): Promise<Notificacao[]> {
    const { data, error } = await supabase
      .schema('hub')
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Notificacao[];
  },

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await supabase
      .schema('hub')
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('lida', false);

    if (error) return 0;
    return count ?? 0;
  },

  async markAsRead(id: string): Promise<void> {
    const payloads = [{ lida: true, lida_em: new Date().toISOString() }, { lida: true }];
    let lastError: unknown = null;

    for (const payload of payloads) {
      const { error } = await supabase
        .schema('hub')
        .from('notificacoes')
        .update(payload)
        .eq('id', id);
      if (!error) return;
      lastError = error;
    }

    throw lastError;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const payloads = [{ lida: true, lida_em: new Date().toISOString() }, { lida: true }];
    let lastError: unknown = null;

    for (const payload of payloads) {
      const { error } = await supabase
        .schema('hub')
        .from('notificacoes')
        .update(payload)
        .eq('usuario_id', userId)
        .eq('lida', false);
      if (!error) return;
      lastError = error;
    }

    throw lastError;
  },
};
