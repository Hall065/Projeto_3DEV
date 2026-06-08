import { useEffect, useState } from 'react';
import { resolveEmpresaForSession } from '@/services/empresa.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Empresa } from '@/types/connect.types';

export function useEmpresaContext() {
  const session = useAuthStore((state) => state.session);
  const isEmpresa = session?.perfil?.tipo === 'empresa';
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(isEmpresa);

  useEffect(() => {
    if (!isEmpresa || !session) {
      setEmpresa(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    resolveEmpresaForSession(session)
      .then((resolved) => {
        if (active) setEmpresa(resolved);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEmpresa, session]);

  return {
    isEmpresa,
    empresa,
    empresaId: empresa?.id ?? null,
    loading,
    isReadOnly: isEmpresa,
  };
}
