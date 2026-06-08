import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, KeyRound, Languages, LogOut, Moon, Sun } from 'lucide-react-native';
import { AppButton, FeedbackMessage, ListRow, SurfaceCard } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPostLoginRoute } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';
import { fetchUserApplications, fetchUserProfile, updateUserProfile } from '@/services/hub.service';
import { uploadService } from '@/services/upload.service';
import { useAppStore } from '@/stores/app.store';
import { useAuthStore } from '@/stores/auth.store';

export default function PerfilScreen() {
  const router = useRouter();
  const { session, setSession, logout } = useAuthStore();
  const theme = useThemeColors();
  const { language, t } = useI18n();
  const { themeMode, toggleThemeMode, setLanguage } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState({
    nome: session?.perfil?.nome ?? '',
    email_institucional: session?.perfil?.email_institucional ?? session?.email ?? '',
    telefone: session?.perfil?.telefone ?? '',
    cpf: session?.perfil?.cpf ?? '',
    senhaAtual: '',
  });

  const perfil = session?.perfil;
  const initials = perfil?.nome?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() ?? 'SH';

  const refreshSession = async () => {
    if (!session?.email) return;
    const [updatedPerfil, aplicacoes] = await Promise.all([
      fetchUserProfile(session.email),
      fetchUserApplications(session.userId),
    ]);
    setSession({ ...session, perfil: updatedPerfil, aplicacoes });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(getPostLoginRoute(session) as never);
  };

  const pickPhoto = async () => {
    if (!session?.userId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita acesso a galeria para atualizar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setSaving(true);
    setError(null);
    try {
      await uploadService.uploadProfilePhoto(result.assets[0].uri, session.userId);
      await refreshSession();
      setSuccess('Foto atualizada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel atualizar a foto.');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!session?.email || !session.userId) return;
    if (!values.senhaAtual.trim()) {
      setError('Informe sua senha atual para confirmar.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: session.email,
        password: values.senhaAtual,
      });
      if (passwordError) throw new Error('Senha incorreta. Alteracoes nao salvas.');

      await updateUserProfile(session.userId, {
        nome: values.nome,
        email_institucional: values.email_institucional,
        telefone: values.telefone,
        cpf: values.cpf,
      });
      await refreshSession();
      setEditing(false);
      setValues((current) => ({ ...current, senhaAtual: '' }));
      setSuccess('Perfil atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/login' as never);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.appBackground }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topActions}>
          <AppButton
            label="Voltar"
            variant="secondary"
            accent={colors.navy}
            icon={<ArrowLeft size={16} color={theme.isDark ? theme.text : colors.navy} />}
            onPress={goBack}
            wrapperStyle={styles.backButtonWrap}
          />
        </View>

        <SurfaceCard title="Perfil do usuario" subtitle="Dados da sua conta SENAI Hub">
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: theme.isDark ? theme.surfaceSoft : colors.navy }]}>
              {perfil?.foto_url ? (
                <Image source={{ uri: perfil.foto_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.profileBody}>
              <Text style={[styles.name, { color: theme.text }]}>{perfil?.nome}</Text>
              <Text style={[styles.role, { color: theme.textMuted }]}>{t(perfil?.tipo)}</Text>
              <AppButton
                label="Trocar foto"
                variant="secondary"
                accent={colors.navy}
                icon={<Camera size={16} color={theme.isDark ? theme.text : colors.navy} />}
                onPress={pickPhoto}
                loading={saving}
              />
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard title="Preferências" subtitle="Tema e idioma do aplicativo">
          <ListRow
            title="Tema atual"
            subtitle={themeMode === 'dark' ? 'Modo escuro' : 'Modo claro'}
            initials="TM"
            accent={themeMode === 'dark' ? colors.purple : colors.orange}
          />
          <AppButton
            label={themeMode === 'dark' ? 'Aplicar modo claro' : 'Aplicar modo escuro'}
            variant="secondary"
            accent={themeMode === 'dark' ? colors.orange : colors.purple}
            icon={themeMode === 'dark' ? <Sun size={16} color={colors.orange} /> : <Moon size={16} color={colors.purple} />}
            onPress={toggleThemeMode}
          />
          <View style={styles.preferenceGap} />
          <ListRow
            title="Idioma"
            subtitle={language === 'en-US' ? 'Inglês' : 'Português'}
            initials="ID"
            accent={colors.blue}
          />
          <View style={styles.preferenceButtons}>
            <AppButton
              label="Usar português"
              variant={language === 'pt-BR' ? 'primary' : 'secondary'}
              accent={colors.blue}
              icon={<Languages size={16} color={language === 'pt-BR' ? colors.white : colors.blue} />}
              onPress={() => setLanguage('pt-BR')}
              wrapperStyle={styles.preferenceButton}
            />
            <AppButton
              label="Usar inglês"
              variant={language === 'en-US' ? 'primary' : 'secondary'}
              accent={colors.blue}
              icon={<Languages size={16} color={language === 'en-US' ? colors.white : colors.blue} />}
              onPress={() => setLanguage('en-US')}
              wrapperStyle={styles.preferenceButton}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard title="Dados pessoais" subtitle="Edicao protegida por senha">
          {editing ? (
            <View style={styles.form}>
              <Field label="Nome" value={values.nome} onChangeText={(nome) => setValues((current) => ({ ...current, nome }))} />
              <Field label="E-mail institucional" value={values.email_institucional} onChangeText={(email_institucional) => setValues((current) => ({ ...current, email_institucional }))} />
              <Field label="Telefone" value={values.telefone} onChangeText={(telefone) => setValues((current) => ({ ...current, telefone }))} />
              <Field label="CPF" value={values.cpf} onChangeText={(cpf) => setValues((current) => ({ ...current, cpf }))} />
              <Field label="Senha atual" secureTextEntry value={values.senhaAtual} onChangeText={(senhaAtual) => setValues((current) => ({ ...current, senhaAtual }))} />
              <AppButton label="Salvar alteracoes" accent={colors.red} onPress={save} loading={saving} />
            </View>
          ) : (
            <>
              <ListRow title="Nome" meta={perfil?.nome} initials="NO" accent={colors.blue} />
              <ListRow title="E-mail" meta={perfil?.email_institucional} initials="EM" accent={colors.green} />
              <ListRow title="Telefone" meta={perfil?.telefone ?? 'Nao informado'} initials="TE" accent={colors.orange} />
              <ListRow title="CPF" meta={perfil?.cpf ?? 'Nao informado'} initials="CP" accent={colors.red} />
              <AppButton label="Editar perfil" accent={colors.red} onPress={() => setEditing(true)} />
            </>
          )}
        </SurfaceCard>

        <SurfaceCard title="Seguranca" subtitle="Senha e recuperacao">
          <ListRow title="Alterar senha" subtitle="Use o fluxo de recuperacao por codigo" initials="SE" accent={colors.red} />
          <AppButton
            label="Abrir recuperacao de senha"
            variant="secondary"
            accent={colors.navy}
            icon={<KeyRound size={16} color={theme.isDark ? theme.text : colors.navy} />}
            onPress={() => router.push('/recuperar-senha' as never)}
          />
        </SurfaceCard>

        <SurfaceCard title="Informacoes do sistema" subtitle="Acesso e versao">
          <ListRow title="Perfil de acesso" meta={perfil?.tipo} initials="PA" accent={colors.blue} />
          <ListRow title="Ultimo login" meta="Sessao atual" initials="UL" accent={colors.green} />
          <ListRow title="Versao do app" meta="1.0.0" initials="VS" accent={colors.orange} />
          <ListRow title="Conta protegida" subtitle="Confirmacao por senha ativa" initials="OK" accent={colors.green} />
        </SurfaceCard>

        <SurfaceCard title="Conta" subtitle="Sessao atual">
          <AppButton
            label="Sair"
            variant="secondary"
            accent={colors.red}
            icon={<LogOut size={16} color={colors.red} />}
            onPress={handleLogout}
            loading={loggingOut}
          />
        </SurfaceCard>

        {error ? <FeedbackMessage variant="danger" message={error} /> : null}
        {success ? <FeedbackMessage variant="success" message={success} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
}) {
  const theme = useThemeColors();
  const { t } = useI18n();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{t(label)}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.input,
            borderColor: theme.line,
            color: theme.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={theme.textSubtle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 24 },
  topActions: { flexDirection: 'row', marginBottom: 12 },
  backButtonWrap: { alignSelf: 'flex-start' },
  preferenceGap: { height: 10 },
  preferenceButtons: { flexDirection: 'row', gap: 10 },
  preferenceButton: { flex: 1 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '900' },
  profileBody: { flex: 1, gap: 8 },
  name: { color: colors.navy, fontSize: 20, fontWeight: '900' },
  role: { color: colors.grayText, fontSize: 12, fontWeight: '800' },
  form: { gap: 12 },
  field: { gap: 6 },
  label: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.navy,
    paddingHorizontal: 12,
  },
});
