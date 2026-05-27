import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChartColumn, FileText, GraduationCap, TrendingUp } from 'lucide-react-native';
import { MetricTile, MiniBars, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { connectService } from '@/services/connect.service';
import type { FrequenciaRegistro } from '@/types/connect.types';

export default function RelatoriosConnectScreen() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    totalCursos: 0,
  });
  const [frequencias, setFrequencias] = useState<FrequenciaRegistro[]>([]);

  useEffect(() => {
    Promise.all([connectService.getDashboardMetrics(), connectService.listFrequencias()])
      .then(([dashboardMetrics, frequenciasData]) => {
        setMetrics(dashboardMetrics);
        setFrequencias(frequenciasData);
      })
      .catch(() => {
        setMetrics({ totalAlunos: 0, totalProfessores: 0, totalTurmas: 0, totalCursos: 0 });
        setFrequencias([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const frequenciaData = [
    { label: 'Pres.', value: frequencias.filter((f) => f.status === 'presente').length, color: colors.green },
    { label: 'Just.', value: frequencias.filter((f) => f.status === 'falta_justificada').length, color: colors.orange },
    { label: 'Faltas', value: frequencias.filter((f) => f.status === 'falta_injustificada').length, color: colors.red },
  ];

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Relatorios"
      description="Indicadores academicos calculados a partir do Supabase."
      isLoading={loading}
    >
      <View style={styles.metricGrid}>
        <MetricTile label="Alunos" value={metrics.totalAlunos} accent={connectTheme.accent} icon={<FileText size={16} color={connectTheme.accent} />} style={styles.metric} />
        <MetricTile label="Frequencias" value={frequencias.length} accent={colors.green} icon={<TrendingUp size={16} color={colors.green} />} style={styles.metric} />
        <MetricTile label="Cursos ativos" value={metrics.totalCursos} accent={colors.blue} icon={<GraduationCap size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Turmas" value={metrics.totalTurmas} accent={colors.orange} icon={<ChartColumn size={16} color={colors.orange} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Frequencia registrada" subtitle="Distribuicao real dos lancamentos">
        {frequencias.length === 0 ? <Text style={styles.empty}>Nenhum dado cadastrado ainda.</Text> : <MiniBars data={frequenciaData} />}
      </SurfaceCard>

      <SurfaceCard title="Exportacoes" subtitle="Arquivos gerados">
        <Text style={styles.empty}>Nenhum arquivo gerado ainda.</Text>
      </SurfaceCard>
    </ModuleScreen>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: { width: '48%' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
