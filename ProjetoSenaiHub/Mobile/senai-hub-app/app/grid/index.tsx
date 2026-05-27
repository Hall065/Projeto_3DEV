import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, ClipboardList, Map, Package, Wrench } from 'lucide-react-native';
import {
  AppButton,
  ListRow,
  MetricTile,
  MiniBars,
  Pill,
  RingMetric,
  SurfaceCard,
} from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { gridService } from '@/services/grid.service';
import type { Chamado, ItemEstoque } from '@/types/grid.types';

export default function GridDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    chamadosAbertos: 0,
    chamadosEmAndamento: 0,
    itensEstoqueBaixo: 0,
    chamadosConcluidos: 0,
  });
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);

  useEffect(() => {
    Promise.all([
      gridService.getDashboardMetrics(),
      gridService.listChamados(),
      gridService.listEstoque(),
    ])
      .then(([dashboardMetrics, chamadosData, estoqueData]) => {
        setMetrics(dashboardMetrics);
        setChamados(chamadosData);
        setEstoque(estoqueData);
      })
      .catch(() => {
        setMetrics({
          chamadosAbertos: 0,
          chamadosEmAndamento: 0,
          itensEstoqueBaixo: 0,
          chamadosConcluidos: 0,
        });
        setChamados([]);
        setEstoque([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const itensCriticos = estoque.filter(
    (item) => item.status === 'estoque_baixo' || item.status === 'esgotado' || item.quantidade_disponivel <= item.quantidade_minima
  );
  const prioridades = [
    { label: 'Baixa', value: chamados.filter((c) => c.prioridade === 'baixa').length, color: colors.green },
    { label: 'Media', value: chamados.filter((c) => c.prioridade === 'media').length, color: colors.blue },
    { label: 'Alta', value: chamados.filter((c) => c.prioridade === 'alta').length, color: colors.orange },
    { label: 'Urgente', value: chamados.filter((c) => c.prioridade === 'urgente').length, color: colors.red },
  ];

  return (
    <ModuleScreen
      kicker="SENAI Grid"
      title="Dashboard"
      description="Resumo operacional da manutenção e infraestrutura."
      isLoading={loading}
    >
      <SurfaceCard tone="dark" title="Operação de infraestrutura" subtitle="Prioridades e chamados em tempo real">
        <View style={styles.heroContent}>
          <RingMetric value={metrics.chamadosAbertos} label="chamados abertos" accent={gridTheme.accent} tone="dark" />
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Fila operacional organizada</Text>
            <Text style={styles.heroText}>
              Chamados, tarefas e estoque aparecem juntos para facilitar a tomada de decisão.
            </Text>
            <View style={styles.heroPills}>
              <Pill label={`${metrics.chamadosEmAndamento} em andamento`} variant="warning" tone="dark" />
              <Pill label={`${itensCriticos.length} itens críticos`} variant="danger" tone="dark" />
            </View>
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.metricGrid}>
        <MetricTile label="Chamados abertos" value={metrics.chamadosAbertos} accent={gridTheme.accent} icon={<ClipboardList size={16} color={gridTheme.accent} />} style={styles.metric} />
        <MetricTile label="Em andamento" value={metrics.chamadosEmAndamento} accent={colors.orange} icon={<Wrench size={16} color={colors.orange} />} style={styles.metric} />
        <MetricTile label="Concluídos" value={metrics.chamadosConcluidos} accent={colors.green} icon={<CheckCircle2 size={16} color={colors.green} />} style={styles.metric} />
        <MetricTile label="Estoque crítico" value={itensCriticos.length} accent={colors.red} icon={<AlertTriangle size={16} color={colors.red} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Atalhos rápidos" subtitle="Acesso direto às rotinas de manutenção">
        <View style={styles.quickGrid}>
          <AppButton
            label="Chamados"
            variant="secondary"
            accent={gridTheme.accent}
            icon={<Wrench size={16} color={gridTheme.accent} />}
            onPress={() => router.push(ROUTES.grid.chamados as never)}
            wrapperStyle={styles.quickButton}
          />
          <AppButton
            label="Tarefas"
            variant="secondary"
            accent={colors.blue}
            icon={<ClipboardList size={16} color={colors.blue} />}
            onPress={() => router.push(ROUTES.grid.tarefas as never)}
            wrapperStyle={styles.quickButton}
          />
          <AppButton
            label="Estoque"
            variant="secondary"
            accent={colors.orange}
            icon={<Package size={16} color={colors.orange} />}
            onPress={() => router.push(ROUTES.grid.estoque as never)}
            wrapperStyle={styles.quickButton}
          />
          <AppButton
            label="Mapa"
            variant="secondary"
            accent={colors.red}
            icon={<Map size={16} color={colors.red} />}
            onPress={() => router.push(ROUTES.grid.mapaTarefas as never)}
            wrapperStyle={styles.quickButton}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard title="Chamados recentes" subtitle="Últimas solicitações registradas">
        {chamados.length === 0 ? <Text style={styles.emptyDark}>Nenhum dado cadastrado ainda.</Text> : null}
        {chamados.slice(0, 5).map((chamado) => (
          <ListRow
            key={chamado.id}
            title={`${chamado.codigo ?? 'CH'} - ${chamado.titulo}`}
            subtitle={`${chamado.sala_nome ?? chamado.bloco_nome ?? 'Local não informado'} - ${chamado.prioridade}`}
            badge={chamado.status}
            badgeVariant={chamado.status === 'concluido' ? 'success' : chamado.prioridade === 'urgente' ? 'danger' : 'warning'}
            initials="CH"
            accent={chamado.prioridade === 'urgente' ? colors.red : colors.orange}
          />
        ))}
      </SurfaceCard>

      <SurfaceCard title="Tarefas por prioridade" subtitle="Distribuição real dos chamados">
        {chamados.length === 0 ? <Text style={styles.emptyDark}>Nenhum dado cadastrado ainda.</Text> : <MiniBars data={prioridades} />}
      </SurfaceCard>

      <SurfaceCard title="Itens com estoque baixo" subtitle="Peças que exigem reposição">
        {itensCriticos.length === 0 ? <Text style={styles.emptyDark}>Nenhum dado cadastrado ainda.</Text> : null}
        {itensCriticos.slice(0, 5).map((item) => (
          <ListRow
            key={item.id}
            title={item.titulo}
            subtitle={`${item.quantidade_disponivel} ${item.unidade} disponíveis`}
            badge={item.status}
            badgeVariant={item.status === 'esgotado' ? 'danger' : 'warning'}
            initials={item.titulo.slice(0, 2).toUpperCase()}
            accent={item.status === 'esgotado' ? colors.red : colors.orange}
          />
        ))}
      </SurfaceCard>
    </ModuleScreen>
  );
}

const styles = StyleSheet.create({
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroBody: { flex: 1, minWidth: 0 },
  heroTitle: { color: colors.white, fontSize: 16, fontWeight: '900' },
  heroText: { color: colors.mutedText, fontSize: 12, lineHeight: 17, marginTop: 5 },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: { width: '48%' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: { width: '48%' },
  emptyDark: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
