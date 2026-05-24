import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { resetPasswordForEmail } from '@/lib/auth';
import { recuperarSenhaSchema, type RecuperarSenhaFormData } from '@/utils/validators';

const circuitBg = require('../assets/brand/senai-circuit-bg.png');
const hubLogo = require('../assets/brand/senai-hub-logo-2.png');

export default function RecuperarSenhaScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<RecuperarSenhaFormData>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: RecuperarSenhaFormData) => {
    setLoading(true);
    setMessage(null);
    const { error } = await resetPasswordForEmail(data.email);
    setLoading(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage('Enviamos um link de recuperação para o seu e-mail.');
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={circuitBg} style={styles.hero}>
        <Image source={hubLogo} style={styles.logo} resizeMode="contain" />
      </ImageBackground>
      <View style={styles.sheet}>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          Informe o e-mail institucional para receber as instruções de redefinição.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
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
              {error ? <Text style={styles.error}>{error.message}</Text> : null}
            </View>
          )}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Enviar link</Text>
          )}
        </Pressable>

        <Link href="/login" style={styles.link}>
          Voltar ao login
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  hero: {
    minHeight: 230,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 52,
  },
  logo: { width: '92%', height: 90 },
  sheet: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
    padding: 28,
  },
  title: { color: colors.navy, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.grayText, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 24 },
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
  input: { flex: 1, color: colors.navy, fontSize: 14, paddingVertical: 12 },
  error: { color: colors.red, fontSize: 12, marginTop: 6 },
  message: { color: colors.green, fontSize: 12, fontWeight: '700', marginBottom: 12 },
  button: {
    minHeight: 52,
    backgroundColor: colors.red,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: colors.white, fontWeight: '900', fontSize: 15 },
  link: { marginTop: 20, color: colors.blue, fontWeight: '800', textAlign: 'center' },
});
