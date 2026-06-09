import { useCallback, useEffect, useState } from 'react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface CrudResourceConfig<T, FormValues> {
  load: () => Promise<T[]>;
  create: (values: FormValues) => Promise<unknown>;
  update: (id: string, values: FormValues) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message?: unknown }).message ?? '').trim();
    if (message) return message;
  }
  return fallback;
}

export function useCrudResource<T extends { id: string }, FormValues>(
  config: CrudResourceConfig<T, FormValues>
) {
  const { load, create, update, remove } = config;
  const { confirm } = useConfirmDialog();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await load();
      setItems(data);
    } catch (err) {
      const message = getErrorMessage(err, 'Nao foi possivel carregar os dados.');
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createItem = async (values: FormValues) => {
    setSubmitting(true);
    try {
      setError(null);
      await create(values);
      await reload();
    } catch (err) {
      const message = getErrorMessage(err, 'Nao foi possivel criar o registro.');
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async (id: string, values: FormValues) => {
    setSubmitting(true);
    try {
      setError(null);
      await update(id, values);
      await reload();
    } catch (err) {
      const message = getErrorMessage(err, 'Nao foi possivel atualizar o registro.');
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = (id: string, label?: string) => {
    const performDelete = async () => {
      setSubmitting(true);
      try {
        setError(null);
        await remove(id);
        await reload();
      } catch (err) {
        const message = getErrorMessage(err, 'Nao foi possivel excluir o registro.');
        setError(message);
      } finally {
        setSubmitting(false);
      }
    };

    const targetLabel = label ?? 'este registro';

    void confirm({
      title: 'Excluir registro',
      message: `Deseja excluir ${targetLabel}?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
    }).then((confirmed) => {
      if (confirmed) void performDelete();
    });
  };

  return {
    items,
    loading,
    submitting,
    error,
    reload,
    createItem,
    updateItem,
    deleteItem,
  };
}
