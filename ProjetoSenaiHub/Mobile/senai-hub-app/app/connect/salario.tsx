import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calculator, DollarSign, Percent, WalletCards } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, ProgressBar, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { TIPO_PAGAMENTO_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { connectService } from '@/services/connect.service';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalarioAluno | null>(null);
  const { options, error: optionsError } = useSelectOptions(salarioOptionLoaders);
  const fields = getFields(options);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<SalarioAluno, Record<string, string>>({
      load: connectService.listSalarios,
      create: connectService.createSalario,
      update: connectService.updateSalario,
      remove: connectService.deleteSalario,
    });

  const totalBase = items.reduce((sum, item) => sum + item.salario_base, 0);
  const averageBase = items.length ? totalBase / items.length : 0;

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title="Salário"
        description="Cálculo mensal com base em faltas injustificadas."
        isLoading={loading}
        actionLabel="+ Novo cálculo"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Bolsa média" value={`R$ ${Math.round(averageBase).toLocaleString('pt-BR')}`} accent={connectTheme.accent} icon={<WalletCards size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Registros" value={items.length} accent={colors.red} icon={<Percent size={16} color={colors.red} />} style={styles.metric} />
          <MetricTile label="Total base" value={`R$ ${Math.round(totalBase).toLocaleString('pt-BR')}`} accent={colors.green} icon={<DollarSign size={16} color={colors.green} />} style={styles.metric} />
          <MetricTile label="Meses" value={new Set(items.map((i) => i.mes_referencia)).size} accent={colors.orange} icon={<Calculator size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        <SurfaceCard title="Cálculo do salário" subtitle="Dados carregados do Supabase">
          <View style={styles.salaryBox}>
            <Text style={styles.salaryLabel}>Total de bolsas base</Text>
            <Text style={styles.salaryValue}>R$ {Math.round(totalBase).toLocaleString('pt-BR')}</Text>
            <ProgressBar value={items.length ? 85 : 0} accent={colors.green} />
          </View>
        </SurfaceCard>

        <SurfaceCard title="Alunos calculados" subtitle="Fechamento mensal por status">
          {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} /> : null}
          {items.length === 0 ? <Text style={styles.empty}>Nenhum cálculo encontrado.</Text> : null}
          {items.map((salario) => (
            <ListRow
              key={salario.id}
              title={salario.aluno_nome ?? salario.aluno_id ?? 'Aluno não vinculado'}
              subtitle={`${salario.mes_referencia} • ${salario.tipo_pagamento ?? 'mensal'}`}
              badge="Registrado"
              badgeVariant="success"
              meta={`R$ ${salario.salario_base.toLocaleString('pt-BR')}`}
              initials="SL"
              accent={colors.green}
              onEdit={() => {
                setEditing(salario);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(salario.id, salario.aluno_nome ?? 'salário')}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

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
    </>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  salaryBox: { borderRadius: 8, backgroundColor: colors.panelSoft, padding: 14, gap: 8 },
  salaryLabel: { color: colors.grayText, fontSize: 12, fontWeight: '800' },
  salaryValue: { color: colors.green, fontSize: 25, fontWeight: '900' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
  error: { color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 },
});
