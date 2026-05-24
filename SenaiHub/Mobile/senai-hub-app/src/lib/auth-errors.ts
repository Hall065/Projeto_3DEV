export function mapAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid api key') || lower.includes('no api key')) {
    return (
      'Chave da API do Supabase inválida ou ausente. No painel Supabase, abra Settings → API Keys, copie a chave Publishable (sb_publishable_...) ou a anon key (eyJ...) e cole em EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env. Depois reinicie: npx expo start -c'
    );
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Confira o usuário em Authentication → Users no Supabase.';
  }

  return message;
}
