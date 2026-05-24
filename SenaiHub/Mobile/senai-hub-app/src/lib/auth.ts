export * from '@/services/auth.service';
// Mantendo retrocompatibilidade para nomes antigos se necessário
export { login as signInWithEmail } from '@/services/auth.service';
