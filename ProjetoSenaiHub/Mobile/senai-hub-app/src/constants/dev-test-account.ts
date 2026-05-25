/**
 * Conta de teste para desenvolvimento (Supabase Auth).
 * Configure em .env — não commitar senhas reais em repositório público.
 */
export const DEV_TEST_ACCOUNT = __DEV__
  ? {
      email: process.env.EXPO_PUBLIC_DEV_TEST_EMAIL ?? 'admin@senai.br',
      password: process.env.EXPO_PUBLIC_DEV_TEST_PASSWORD ?? '12345678',
      label: process.env.EXPO_PUBLIC_DEV_TEST_LABEL ?? 'Admin (teste)',
    }
  : null;

export const hasDevTestAccount = Boolean(
  DEV_TEST_ACCOUNT?.email && DEV_TEST_ACCOUNT?.password
);
