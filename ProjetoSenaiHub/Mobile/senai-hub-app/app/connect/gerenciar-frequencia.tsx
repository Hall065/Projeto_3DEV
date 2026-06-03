import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Download, FileText, TrendingUp, Users } from 'lucide-react-native';
import { ExportModal } from '@/components/common/ExportModal';
import { ListRow, MetricTile, MiniBars, ProgressBar, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { connectService } from '@/services/connect.service';
import { exportService } from '@/services/export.service';
import type { FrequenciaRegistro } from '@/types/connect.types';

export default function GerenciarFrequenciaScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FrequenciaRegistro[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    connectService
      .listFrequencias()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const presentes = items.filter((item) => item.status === 'presente').length;
  const faltas = items.length - presentes;
  const presenca = items.length ? Math.round((presentes / items.length) * 100) : 0;

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Gerenciar frequencia"
      description="Visualizacao, calculo e exportacao de relatorios."
      isLoading={loading}
      actionLabel="Exportar"
      onActionPress={() => setExportOpen(true)}
    >
      <View style={styles.metricGrid}>
        <MetricTile label="Registros" value={items.length} accent={connectTheme.accent} icon={<FileText size={16} color={connectTheme.accent} />} style={styles.metric} />
        <MetricTile label="Presenca geral" value={`${presenca}%`} accent={colors.green} icon={<TrendingUp size={16} color={colors.green} />} style={styles.metric} />
        <MetricTile label="Alunos monitorados" value={new Set(items.map((i) => i.aluno_id)).size} accent={colors.blue} icon={<Users size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Faltas" value={faltas} accent={colors.orange} icon={<Download size={16} color={colors.orange} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Evolucao da frequencia" subtitle="Comparativo dos registros reais">
        <MiniBars
          data={[
            { label: 'Pres.', value: presentes, color: colors.green },
            { label: 'Faltas', value: faltas, color: colors.red },
            { label: 'Total', value: items.length, color: colors.blue },
          ]}
        />
      </SurfaceCard>

      <SurfaceCard title="Turmas recentes" subtitle="Status de calculo e fechamento">
        {items.slice(0, 8).map((item) => (
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
      </SurfaceCard>

      <SurfaceCard title="Indicadores de ausencia" subtitle="Faltas justificadas e injustificadas">
        <View style={styles.progressStack}>
          <ProgressBar value={presenca} accent={colors.green} />
          <ProgressBar value={items.length ? Math.round((faltas / items.length) * 100) : 0} accent={colors.red} />
        </View>
      </SurfaceCard>

      <ExportModal
        visible={exportOpen}
        title="Exportar frequencia"
        onClose={() => setExportOpen(false)}
        onPDF={async () => {
          await exportService.exportarPDF(toRows(items), 'Relatorio de frequencia');
          setExportOpen(false);
        }}
        onExcel={async () => {
          await exportService.exportarExcel(toRows(items), 'relatorio-frequencia');
          setExportOpen(false);
        }}
      />
    </ModuleScreen>
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
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  progressStack: { gap: 14, paddingVertical: 8 },
});
