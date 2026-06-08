import { Redirect } from 'expo-router';
import { getPostLoginRoute } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';

export default function Index() {
  const session = useAuthStore((s) => s.session);

  if (session) {
    return <Redirect href={getPostLoginRoute(session) as never} />;
  }

  return <Redirect href="/login" />;
}
