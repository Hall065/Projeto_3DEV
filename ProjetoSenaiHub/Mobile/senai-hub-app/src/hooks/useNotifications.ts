import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notificationService, type Notificacao } from '@/services/notification.service';

const makeChannelName = (prefix: string, id: string) =>
  `${prefix}-${id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const data = await notificationService.listByUser(userId);
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase.channel(makeChannelName('hub-notificacoes', userId));

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'hub',
        table: 'notificacoes',
        filter: `usuario_id=eq.${userId}`,
      },
      () => reload()
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload, userId]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.lida).length,
    [notifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      await notificationService.markAsRead(id);
      await reload();
    },
    [reload]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
    await reload();
  }, [reload, userId]);

  return {
    notifications,
    unreadCount,
    loading,
    reload,
    markAsRead,
    markAllAsRead,
  };
}
