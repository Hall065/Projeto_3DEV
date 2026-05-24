import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface CrudResourceConfig<T, FormValues> {
  load: () => Promise<T[]>;
  create: (values: FormValues) => Promise<unknown>;
  update: (id: string, values: FormValues) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

export function useCrudResource<T extends { id: string }, FormValues>(
  config: CrudResourceConfig<T, FormValues>
) {
  const { load, create, update, remove } = config;
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
      const message = err instanceof Error ? err.message : 'Não foi possível carregar os dados.';
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
      await create(values);
      await reload();
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async (id: string, values: FormValues) => {
    setSubmitting(true);
    try {
      await update(id, values);
      await reload();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = (id: string, label = 'este registro') => {
    Alert.alert('Excluir registro', `Deseja excluir ${label}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await remove(id);
            await reload();
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
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
