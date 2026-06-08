import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { AppButton, ListRow, LoadingState, SurfaceCard } from '@/components/common/VisualPrimitives';
import { colors, connectTheme } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { studentService, type StudentDashboardData } from '@/services/student.service';
import { useAuthStore } from '@/stores/auth.store';

export default function AlunoPerfilScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [data, setData] = useState<StudentDashboardData | null>(null);

  useEffect(() => {
    if (!session?.userId) return;
    studentService
      .getDashboard(session.userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [session?.userId]);

  if (loading) return <LoadingState />;

  const aluno = data?.aluno;
  const contrato = data?.contratos[0];
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
    <ScrollView style={[styles.container, { backgroundColor: theme.appBackground }]} contentContainerStyle={styles.content}>
      <SurfaceCard title="Dados pessoais" subtitle="Informacoes somente leitura">
        <ListRow title={aluno?.nome ?? session?.perfil?.nome ?? 'Aluno'} subtitle={session?.email} initials={(aluno?.nome ?? 'AL').slice(0, 2).toUpperCase()} imageUri={aluno?.foto_url ?? session?.perfil?.foto_url} accent={connectTheme.accent} />
        <Info label="RM" value={aluno?.rm} />
        <Info label="CPF" value={aluno?.cpf} />
        <Info label="Data de nascimento" value={aluno?.data_nascimento} />
        <Info label="Responsavel" value={aluno?.nome_responsavel} />
      </SurfaceCard>

      <SurfaceCard title="Dados academicos" subtitle="Curso, turma e empresa">
        <Info label="Curso" value={aluno?.curso_nome} />
        <Info label="Turma" value={aluno?.turma_nome} />
        <Info label="Periodo" value={undefined} />
        <Info label="Empresa" value={aluno?.empresa_nome ?? contrato?.empresa_nome} />
      </SurfaceCard>

      <SurfaceCard title="Contrato" subtitle="Vinculo com empresa">
        {contrato ? (
          <>
            <Info label="Empresa" value={contrato.empresa_nome} />
            <Info label="Carga horaria" value={contrato.carga_horaria} />
            <Info label="Inicio" value={contrato.data_inicio} />
            <Info label="Termino" value={contrato.data_termino} />
          </>
        ) : (
          <Text style={[styles.empty, { color: theme.textMuted }]}>Nenhum contrato encontrado.</Text>
        )}
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
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <ListRow
      title={label}
      meta={value ?? 'Nao informado'}
      initials={label.slice(0, 2).toUpperCase()}
      accent={colors.blue}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 24 },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
