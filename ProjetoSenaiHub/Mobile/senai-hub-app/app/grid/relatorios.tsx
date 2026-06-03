import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChartColumn, CheckCircle2, ClipboardList, TrendingUp } from 'lucide-react-native';
import { ExportModal } from '@/components/common/ExportModal';
import { MetricTile, MiniBars, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { exportService } from '@/services/export.service';
import { gridService } from '@/services/grid.service';
import type { Chamado, ItemEstoque, Tarefa } from '@/types/grid.types';

export default function RelatoriosGridScreen() {
  const [loading, setLoading] = useState(true);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    Promise.all([gridService.listChamados(), gridService.listTarefas(), gridService.listEstoque()])
      .then(([chamadosData, tarefasData, estoqueData]) => {
        setChamados(chamadosData);
        setTarefas(tarefasData);
        setEstoque(estoqueData);
      })
      .catch(() => {
        setChamados([]);
        setTarefas([]);
        setEstoque([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const tarefasConcluidas = tarefas.filter((tarefa) => tarefa.status === 'concluida' || tarefa.status === 'concluido').length;
  const custoTotal = estoque.reduce((sum, item) => sum + item.quantidade_disponivel * (item.custo ?? 0), 0);
  const chamadosPorStatus = [
    { label: 'Aberto', value: chamados.filter((c) => c.status === 'aberto').length, color: colors.orange },
    { label: 'And.', value: chamados.filter((c) => c.status === 'em_andamento').length, color: colors.blue },
    { label: 'Conc.', value: chamados.filter((c) => c.status === 'concluido' || c.status === 'concluida').length, color: gridTheme.accent },
  ];

  return (
    <ModuleScreen
      kicker="SENAI Grid"
      title="Relatorios"
      description="Indicadores de manutencao calculados a partir do Supabase."
      isLoading={loading}
      actionLabel="Exportar"
      onActionPress={() => setExportOpen(true)}
    >
      <View style={styles.metricGrid}>
        <MetricTile label="Tarefas concluidas" value={tarefasConcluidas} accent={gridTheme.accent} icon={<CheckCircle2 size={16} color={gridTheme.accent} />} style={styles.metric} />
        <MetricTile label="Tarefas abertas" value={tarefas.length - tarefasConcluidas} accent={colors.blue} icon={<TrendingUp size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Custo em estoque" value={`R$ ${Math.round(custoTotal).toLocaleString('pt-BR')}`} accent={colors.orange} icon={<ChartColumn size={16} color={colors.orange} />} style={styles.metric} />
        <MetricTile label="Chamados" value={chamados.length} accent={colors.red} icon={<ClipboardList size={16} color={colors.red} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Chamados por status" subtitle="Distribuicao real das solicitacoes">
        {chamados.length === 0 ? <Text style={styles.empty}>Nenhum dado cadastrado ainda.</Text> : <MiniBars data={chamadosPorStatus} />}
      </SurfaceCard>

      <SurfaceCard title="Exportacoes" subtitle="Arquivos gerados">
        <Text style={styles.empty}>Use o botao Exportar para gerar PDF ou Excel.</Text>
      </SurfaceCard>

      <ExportModal
        visible={exportOpen}
        title="Exportar manutencoes"
        onClose={() => setExportOpen(false)}
        onPDF={async () => {
          await exportService.exportarPDF(toRows(chamados, tarefas, estoque), 'Relatorio de manutencoes');
          setExportOpen(false);
        }}
        onExcel={async () => {
          await exportService.exportarExcel(toRows(chamados, tarefas, estoque), 'relatorio-manutencoes');
          setExportOpen(false);
        }}
      />
    </ModuleScreen>
  );
}

function toRows(chamados: Chamado[], tarefas: Tarefa[], estoque: ItemEstoque[]) {
  return [
    ...chamados.map((item) => ({
      tipo: 'Chamado',
      titulo: item.titulo,
      status: item.status,
      prioridade: item.prioridade,
      local: item.sala_nome ?? item.bloco_nome,
    })),
    ...tarefas.map((item) => ({
      tipo: 'Tarefa',
      titulo: item.titulo,
      status: item.status,
      prioridade: item.prioridade,
      responsavel: item.responsavel_nome,
    })),
    ...estoque.map((item) => ({
      tipo: 'Estoque',
      titulo: item.titulo,
      status: item.status,
      quantidade: item.quantidade_disponivel,
      custo: item.custo,
    })),
  ];
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
