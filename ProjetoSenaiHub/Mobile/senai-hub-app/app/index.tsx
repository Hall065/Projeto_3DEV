import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const session = useAuthStore((s) => s.session);

  if (session) {
    return <Redirect href={(session.perfil?.tipo === 'aluno' ? '/aluno/dashboard' : '/hub') as never} />;
  }

  return <Redirect href="/login" />;
}
