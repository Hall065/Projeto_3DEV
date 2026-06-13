import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Download, FileText, TrendingUp, Users } from 'lucide-react-native';
import { ChartCard, InteractiveBarChart } from '@/components/charts';
import { ExportModal } from '@/components/common/ExportModal';
import { MetricGrid } from '@/components/common/MetricGrid';
import { AnimatedPressable, FeedbackMessage, ListRow, MetricTile, ProgressBar, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { listFrequenciasByEmpresaId } from '@/services/empresa.service';
import { connectService } from '@/services/connect.service';
import { exportService } from '@/services/export.service';
import { useAuthStore } from '@/stores/auth.store';
import type { FrequenciaRegistro } from '@/types/connect.types';

export default function GerenciarFrequenciaScreen() {
  const session = useAuthStore((s) => s.session);
  const { isEmpresa, empresa, empresaId, loading: empresaLoading } = useEmpresaContext();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FrequenciaRegistro[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [alunoFilter, setAlunoFilter] = useState('all');

  useEffect(() => {
    async function load() {
      if (!session?.userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (isEmpresa && empresaId) {
          setItems(await listFrequenciasByEmpresaId(empresaId));
          return;
        }

        const frequencias = await connectService.listFrequencias();
        if (session.perfil?.tipo !== 'professor') {
          setItems(frequencias);
          return;
        }
        const turmas = await connectService.listTurmasForProfessorUser(session.userId);
        const turmaIds = new Set(turmas.map((turma) => turma.id));
        setItems(frequencias.filter((item) => item.turma_id && turmaIds.has(item.turma_id)));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId, isEmpresa, session?.perfil?.tipo, session?.userId]);

  const alunoOptions = useMemo(() => {
    const unique = new Map<string, string>();
    items.forEach((item) => {
      if (item.aluno_id) unique.set(item.aluno_id, item.aluno_nome ?? item.aluno_id);
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);

  const filteredItems = items.filter((item) => alunoFilter === 'all' || item.aluno_id === alunoFilter);
  const presentes = filteredItems.filter((item) => item.status === 'presente').length;
  const faltas = filteredItems.length - presentes;
  const presenca = filteredItems.length ? Math.round((presentes / filteredItems.length) * 100) : 0;
  const screenLoading = loading || (isEmpresa && empresaLoading);

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title={isEmpresa ? 'Frequencia dos aprendizes' : 'Gerenciar frequencia'}
      description={
        isEmpresa
          ? `Registros de presenca dos aprendizes de ${empresa?.nome ?? 'sua empresa'}.`
          : 'Visualizacao, calculo e exportacao de relatorios.'
      }
      isLoading={screenLoading}
      actionLabel="Exportar"
      onActionPress={() => setExportOpen(true)}
    >
      {isEmpresa && !empresa && !screenLoading ? (
        <FeedbackMessage
          variant="warning"
          message="Nao foi possivel identificar a empresa vinculada ao seu usuario."
        />
      ) : null}

      <MetricGrid>
        <MetricTile label="Registros" value={filteredItems.length} accent={connectTheme.accent} icon={<FileText size={16} color={connectTheme.accent} />} />
        <MetricTile label="Presenca geral" value={`${presenca}%`} accent={colors.green} icon={<TrendingUp size={16} color={colors.green} />} />
        <MetricTile label="Alunos monitorados" value={new Set(filteredItems.map((i) => i.aluno_id)).size} accent={colors.blue} icon={<Users size={16} color={colors.blue} />} />
        <MetricTile label="Faltas" value={faltas} accent={colors.orange} icon={<Download size={16} color={colors.orange} />} />
      </MetricGrid>

      {alunoOptions.length > 0 ? (
        <SurfaceCard title="Filtrar por aprendiz" subtitle="Somente alunos com contrato na empresa">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip label="Todos" active={alunoFilter === 'all'} onPress={() => setAlunoFilter('all')} />
            {alunoOptions.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                active={alunoFilter === option.value}
                onPress={() => setAlunoFilter(option.value)}
              />
            ))}
          </ScrollView>
        </SurfaceCard>
      ) : null}

      <ChartCard
        title="Evolucao da frequencia"
        subtitle="Comparativo dos registros reais"
        empty={filteredItems.length === 0}
        summary={`${presenca}% de presenca nos filtros atuais`}
      >
        <InteractiveBarChart
          data={[
            { label: 'Presencas', value: presentes, color: colors.green },
            { label: 'Faltas', value: faltas, color: colors.red },
            { label: 'Total', value: filteredItems.length, color: colors.blue },
          ]}
        />
      </ChartCard>

      <SurfaceCard title="Registros recentes" subtitle="Status de calculo e fechamento">
        {filteredItems.slice(0, 8).map((item) => (
          <ListRow
            key={item.id}
            title={item.aluno_nome ?? item.aluno_id}
            subtitle={`${item.turma_nome ?? 'Turma nao vinculada'} - ${item.data_aula ?? item.data ?? 'sem data'}`}
            badge={item.status}
            badgeVariant={item.status === 'presente' ? 'success' : 'warning'}
            initials="FR"
            accent={item.status === 'presente' ? colors.green : colors.orange}
          />
        ))}
        {filteredItems.length === 0 ? (
          <FeedbackMessage variant="info" message="Nenhum registro de frequencia encontrado para os filtros selecionados." />
        ) : null}
      </SurfaceCard>

      <SurfaceCard title="Indicadores de ausencia" subtitle="Faltas justificadas e injustificadas">
        <View style={styles.progressStack}>
          <ProgressBar value={presenca} accent={colors.green} />
          <ProgressBar value={filteredItems.length ? Math.round((faltas / filteredItems.length) * 100) : 0} accent={colors.red} />
        </View>
      </SurfaceCard>

      <ExportModal
        visible={exportOpen}
        title="Exportar frequencia"
        onClose={() => setExportOpen(false)}
        onPDF={async () => {
          await exportService.exportarPDF(toRows(filteredItems), 'Relatorio de frequencia');
          setExportOpen(false);
        }}
        onExcel={async () => {
          await exportService.exportarExcel(toRows(filteredItems), 'relatorio-frequencia');
          setExportOpen(false);
        }}
      />
    </ModuleScreen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} style={[styles.filterChip, active ? styles.filterChipActive : null]}>
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{label}</Text>
    </AnimatedPressable>
  );
}

function toRows(items: FrequenciaRegistro[]) {
  return items.map((item) => ({
    aluno: item.aluno_nome ?? item.aluno_id,
    turma: item.turma_nome,
    data: item.data_aula ?? item.data,
    status: item.status,
    aulas_faltadas: item.quantidade_aulas_faltadas ?? 0,
  }));
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    borderColor: connectTheme.accent,
    backgroundColor: 'rgba(227,6,19,0.08)',
  },
  filterChipText: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: connectTheme.accent },
  progressStack: { gap: 14, paddingVertical: 8 },
});
