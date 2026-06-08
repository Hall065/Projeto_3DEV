import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calculator, DollarSign, Percent, WalletCards } from 'lucide-react-native';
import { ExportModal } from '@/components/common/ExportModal';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { AnimatedPressable, AppButton, FeedbackMessage, ListRow, MetricTile, ProgressBar, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { TIPO_PAGAMENTO_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { canManageConnectData } from '@/lib/permissions';
import { listSalariosByEmpresaId } from '@/services/empresa.service';
import { connectService } from '@/services/connect.service';
import { exportService } from '@/services/export.service';
import { useAuthStore } from '@/stores/auth.store';
import type { SalarioAluno } from '@/types/connect.types';

const salarioOptionLoaders = {
  alunos: connectService.listAlunoOptions,
  empresas: connectService.listEmpresaOptions,
  contratos: connectService.listContratoOptions,
};

type SalarioOptionKey = keyof typeof salarioOptionLoaders;
type SalarioOptions = Record<SalarioOptionKey, CrudOption[]>;

function getFields(options: Partial<SalarioOptions>): CrudField[] {
  return [
    { name: 'aluno_id', label: 'Aluno', required: true, options: options.alunos ?? [] },
    { name: 'empresa_id', label: 'Empresa', options: options.empresas ?? [], emptyOptionLabel: 'Sem empresa' },
    { name: 'contrato_id', label: 'Contrato', options: options.contratos ?? [], emptyOptionLabel: 'Sem contrato' },
    { name: 'tipo_pagamento', label: 'Tipo de pagamento', required: true, options: TIPO_PAGAMENTO_OPTIONS },
    { name: 'salario_base', label: 'Salário base', placeholder: '1200,00', keyboardType: 'decimal-pad', mask: 'currency', required: true },
    { name: 'valor_hora', label: 'Valor hora', placeholder: '12,50', keyboardType: 'decimal-pad', mask: 'currency' },
    { name: 'carga_diaria_horas', label: 'Carga diária', placeholder: '6', keyboardType: 'decimal-pad', mask: 'decimal' },
    { name: 'dias_uteis_mes', label: 'Dias úteis do mês', placeholder: '22', keyboardType: 'numeric', mask: 'integer' },
    { name: 'mes_referencia', label: 'Mês de referência', placeholder: 'MM/AAAA', mask: 'month', required: true },
  ];
}

function formValues(salario: SalarioAluno): Record<string, string> {
  return {
    aluno_id: salario.aluno_id ?? '',
    empresa_id: salario.empresa_id ?? '',
    contrato_id: salario.contrato_id ?? '',
    tipo_pagamento: salario.tipo_pagamento ?? 'mensal',
    salario_base: String(salario.salario_base ?? 0),
    valor_hora: salario.valor_hora ? String(salario.valor_hora) : '',
    carga_diaria_horas: salario.carga_diaria_horas ? String(salario.carga_diaria_horas) : '6',
    dias_uteis_mes: salario.dias_uteis_mes ? String(salario.dias_uteis_mes) : '22',
    mes_referencia: salario.mes_referencia ?? new Date().toISOString().slice(0, 7),
  };
}

export default function SalarioScreen() {
  const session = useAuthStore((state) => state.session);
  const { isEmpresa, empresa, empresaId, loading: empresaLoading } = useEmpresaContext();
  const canManage = canManageConnectData(session?.perfil?.tipo);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editing, setEditing] = useState<SalarioAluno | null>(null);
  const [alunoFilter, setAlunoFilter] = useState('all');
  const { options, error: optionsError } = useSelectOptions(salarioOptionLoaders);
  const fields = getFields(options);

  const loadSalarios = useCallback(async () => {
    if (isEmpresa && empresaId) return listSalariosByEmpresaId(empresaId);
    return connectService.listSalarios();
  }, [empresaId, isEmpresa]);

  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<SalarioAluno, Record<string, string>>({
      load: loadSalarios,
      create: connectService.createSalario,
      update: connectService.updateSalario,
      remove: connectService.deleteSalario,
    });

  const alunoOptions = useMemo(() => {
    const unique = new Map<string, string>();
    items.forEach((item) => {
      if (item.aluno_id) unique.set(item.aluno_id, item.aluno_nome ?? item.aluno_id);
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);

  const filteredItems = items.filter((item) => alunoFilter === 'all' || item.aluno_id === alunoFilter);
  const totalBase = filteredItems.reduce((sum, item) => sum + item.salario_base, 0);
  const totalFinal = filteredItems.reduce((sum, item) => sum + (item.salario_final ?? item.salario_base), 0);
  const averageBase = filteredItems.length ? totalBase / filteredItems.length : 0;
  const screenLoading = loading || (isEmpresa && empresaLoading);

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title={isEmpresa ? 'Cálculo salarial' : 'Salário'}
        description={
          isEmpresa
            ? `Bolsas e descontos dos aprendizes de ${empresa?.nome ?? 'sua empresa'}.`
            : 'Cálculo mensal com base em faltas injustificadas.'
        }
        isLoading={screenLoading}
        actionLabel={canManage ? '+ Novo cálculo' : undefined}
        onActionPress={
          canManage
            ? () => {
                setEditing(null);
                setModalOpen(true);
              }
            : undefined
        }
      >
        {isEmpresa && !empresa && !screenLoading ? (
          <FeedbackMessage
            variant="warning"
            message="Não foi possível identificar a empresa vinculada ao seu usuário."
          />
        ) : null}

        <View style={styles.metricGrid}>
          <MetricTile label="Bolsa média" value={`R$ ${Math.round(averageBase).toLocaleString('pt-BR')}`} accent={connectTheme.accent} icon={<WalletCards size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Registros" value={filteredItems.length} accent={colors.red} icon={<Percent size={16} color={colors.red} />} style={styles.metric} />
          <MetricTile label="Total final" value={`R$ ${Math.round(totalFinal).toLocaleString('pt-BR')}`} accent={colors.green} icon={<DollarSign size={16} color={colors.green} />} style={styles.metric} />
          <MetricTile label="Meses" value={new Set(filteredItems.map((i) => i.mes_referencia)).size} accent={colors.orange} icon={<Calculator size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        {alunoOptions.length > 0 ? (
          <SurfaceCard title="Filtrar por aprendiz" subtitle="Alunos com cálculo salarial na empresa">
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

        <SurfaceCard title="Cálculo do salário" subtitle={isEmpresa ? 'Somente leitura' : 'Dados carregados do Supabase'}>
          <View style={styles.salaryBox}>
            <Text style={styles.salaryLabel}>Total de bolsas base</Text>
            <Text style={styles.salaryValue}>R$ {Math.round(totalBase).toLocaleString('pt-BR')}</Text>
            <ProgressBar value={filteredItems.length ? 85 : 0} accent={colors.green} />
            <AppButton
              label="Exportar PDF ou Excel"
              variant="secondary"
              accent={connectTheme.accent}
              onPress={() => setExportOpen(true)}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard title="Alunos calculados" subtitle="Fechamento mensal por status">
          {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} /> : null}
          {filteredItems.length === 0 ? <Text style={styles.empty}>Nenhum cálculo encontrado.</Text> : null}
          {filteredItems.map((salario) => (
            <ListRow
              key={salario.id}
              title={salario.aluno_nome ?? salario.aluno_id ?? 'Aluno não vinculado'}
              subtitle={`${salario.mes_referencia} • ${salario.tipo_pagamento ?? 'mensal'}`}
              badge={salario.salario_final ? `R$ ${Math.round(salario.salario_final).toLocaleString('pt-BR')}` : 'Registrado'}
              badgeVariant="success"
              meta={`Base R$ ${salario.salario_base.toLocaleString('pt-BR')}`}
              initials="SL"
              accent={colors.green}
              onEdit={
                canManage
                  ? () => {
                      setEditing(salario);
                      setModalOpen(true);
                    }
                  : undefined
              }
              onDelete={canManage ? () => deleteItem(salario.id, salario.aluno_nome ?? 'salário') : undefined}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      {canManage ? (
        <CrudModal
          visible={modalOpen}
          title={editing ? 'Editar salário' : 'Novo salário'}
          fields={fields}
          initialValues={editing ? formValues(editing) : { tipo_pagamento: 'mensal', carga_diaria_horas: '6', dias_uteis_mes: '22', mes_referencia: new Date().toISOString().slice(0, 7) }}
          isSubmitting={submitting}
          submitLabel={editing ? 'Salvar alterações' : 'Salvar cálculo'}
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            if (editing) await updateItem(editing.id, values);
            else await createItem(values);
            setModalOpen(false);
          }}
        />
      ) : null}
      <ExportModal
        visible={exportOpen}
        title="Exportar salarios"
        onClose={() => setExportOpen(false)}
        onPDF={async () => {
          await exportService.exportarPDF(toRows(filteredItems), 'Relatorio de salarios');
          setExportOpen(false);
        }}
        onExcel={async () => {
          await exportService.exportarExcel(toRows(filteredItems), 'relatorio-salarios');
          setExportOpen(false);
        }}
      />
    </>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} style={[styles.filterChip, active ? styles.filterChipActive : null]}>
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{label}</Text>
    </AnimatedPressable>
  );
}

function toRows(items: SalarioAluno[]) {
  return items.map((item) => ({
    aluno: item.aluno_nome ?? item.aluno_id,
    empresa: item.empresa_nome,
    mes: item.mes_referencia,
    salario_base: item.salario_base,
    valor_dia: item.valor_dia,
    desconto: item.desconto,
    salario_final: item.salario_final,
    faltas_injustificadas: item.faltas_injustificadas,
  }));
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
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
  salaryBox: { borderRadius: 8, backgroundColor: colors.panelSoft, padding: 14, gap: 8 },
  salaryLabel: { color: colors.grayText, fontSize: 12, fontWeight: '800' },
  salaryValue: { color: colors.green, fontSize: 25, fontWeight: '900' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
