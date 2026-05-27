import { useEffect, useState } from 'react';
import type { CrudOption } from '@/components/common/CrudModal';

type LoaderMap<T extends string> = Record<T, () => Promise<CrudOption[]>>;
type OptionMap<T extends string> = Record<T, CrudOption[]>;

export function useSelectOptions<T extends string>(loaders: LoaderMap<T>) {
  const [options, setOptions] = useState<OptionMap<T>>({} as OptionMap<T>);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setError(null);
      try {
        const entries = await Promise.all(
          (Object.entries(loaders) as [T, () => Promise<CrudOption[]>][]).map(
            async ([key, loader]) => [key, await loader()] as const
          )
        );
        if (active) {
          setOptions(Object.fromEntries(entries) as OptionMap<T>);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Nao foi possivel carregar as opcoes.');
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [loaders]);

  return { options, error };
}
