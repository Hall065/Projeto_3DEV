import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { getSupabaseKeyHint, isSupabaseConfigured } from '@/lib/supabase-config';
import { useAuthStore } from '@/stores/auth.store';
import { loginSchema, type LoginFormData } from '@/utils/validators';

const circuitBg = require('../assets/brand/senai-circuit-bg.png');
const hubLogo = require('../assets/brand/senai-hub-logo-2.png');

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleBypass = () => {
    loginAsGuest();
    router.replace('/hub');
  };

  const onSubmit = async (data: LoginFormData) => {
    console.log('[Login] Iniciando tentativa para:', data.email);
    setError(null);
    try {
      const err = await login(data.email, data.password);
      if (err) {
        console.warn('[Login] Falha:', err);
        setError(err);
        return;
      }
      console.log('[Login] Sucesso! Redirecionando para /hub');
      router.replace('/hub');
    } catch (e: any) {
      console.error('[Login] Erro inesperado:', e);
      setError('Ocorreu um erro inesperado ao tentar entrar.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground source={circuitBg} style={styles.hero} imageStyle={styles.heroImage}>
          <Image source={hubLogo} style={styles.logo} resizeMode="contain" />
        </ImageBackground>

        <View style={styles.sheet}>
          <Text style={styles.title}>Acesse sua conta</Text>
          <Text style={styles.subtitle}>Informe seu e-mail e senha para continuar.</Text>

          {__DEV__ && !isSupabaseConfigured ? (
            <Text style={styles.configWarning}>
              Supabase não configurado. Verifique o .env e reinicie o Expo com -c.
            </Text>
          ) : null}
          {__DEV__ && isSupabaseConfigured ? (
            <Text style={styles.configHint}>API: {getSupabaseKeyHint()}</Text>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputWrap}>
                  <Mail size={17} color={colors.grayText} />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.mutedText}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
                {fieldError ? <Text style={styles.fieldError}>{fieldError.message}</Text> : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrap}>
                  <Lock size={17} color={colors.grayText} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedText}
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={17} color={colors.grayText} />
                    ) : (
                      <Eye size={17} color={colors.grayText} />
                    )}
                  </Pressable>
                </View>
                {fieldError ? <Text style={styles.fieldError}>{fieldError.message}</Text> : null}
              </View>
            )}
          />

          <View style={styles.forgotRow}>
            <Link href="/recuperar-senha" style={styles.link}>
              Recuperar senha
            </Link>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>

          <Pressable style={styles.testAccess} onPress={handleBypass}>
            <Text style={styles.testAccessText}>Acesso rápido para demonstração</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, backgroundColor: colors.white },
  hero: {
    minHeight: 300,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingTop: 30,
  },
  heroImage: { resizeMode: 'cover' },
  logo: { width: '92%', height: 110 },
  sheet: {
    flex: 1,
    marginTop: -34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
  },
  title: { color: colors.navy, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.grayText, fontSize: 13, marginTop: 6, marginBottom: 24 },
  configWarning: {
    color: colors.red,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  configHint: {
    color: colors.grayText,
    fontSize: 11,
    marginBottom: 12,
  },
  field: { marginBottom: 14 },
  label: { color: colors.navy, fontSize: 13, fontWeight: '800', marginBottom: 7 },
  inputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    color: colors.navy,
    fontSize: 14,
    paddingVertical: 12,
  },
  fieldError: { color: colors.red, fontSize: 11, marginTop: 5 },
  forgotRow: { alignItems: 'flex-start', marginTop: -2, marginBottom: 12 },
  link: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  error: { color: colors.red, marginBottom: 12, textAlign: 'center', fontSize: 12 },
  button: {
    minHeight: 52,
    backgroundColor: colors.red,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  testAccess: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  testAccessText: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  devButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
  },
  devButtonText: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  devHint: { marginTop: 4, fontSize: 11, color: colors.grayText },
});
