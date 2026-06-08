import type { CrudOption } from '@/components/common/CrudModal';

export const USER_STATUS_OPTIONS: CrudOption[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];

export const TURMA_STATUS_OPTIONS: CrudOption[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' },
];

export const EMPRESA_STATUS_OPTIONS: CrudOption[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' },
];

export const CONTRATO_STATUS_OPTIONS: CrudOption[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'encerrado', label: 'Encerrado' },
];

export const PERIODO_OPTIONS: CrudOption[] = [
  { value: 'manha', label: 'Manha' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral' },
];

export const CURSO_MODALIDADE_OPTIONS: CrudOption[] = [
  { value: 'tecnico', label: 'Tecnico' },
  { value: 'aprendizagem', label: 'Aprendizagem' },
  { value: 'qualificacao', label: 'Qualificacao' },
];

export const USER_ROLE_OPTIONS: CrudOption[] = [
  { value: 'grid_funcionario', label: 'Funcionario Grid' },
  { value: 'grid_chefe', label: 'Chefe Grid' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'gerente_manutencao', label: 'Gerente de manutencao' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'connect_secretaria', label: 'Secretaria Connect' },
  { value: 'connect_aqv', label: 'AQV Connect' },
  { value: 'professor', label: 'Professor' },
  { value: 'connect_professor', label: 'Professor Connect' },
  { value: 'direcao', label: 'Direcao' },
  { value: 'admin', label: 'Admin' },
];

export const CHAMADO_PRIORIDADE_OPTIONS: CrudOption[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export const CHAMADO_STATUS_OPTIONS: CrudOption[] = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluido' },
];

export const TAREFA_STATUS_OPTIONS: CrudOption[] = [
  { value: 'a_fazer', label: 'A fazer' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluida' },
];

export const ESTOQUE_STATUS_OPTIONS: CrudOption[] = [
  { value: 'disponivel', label: 'Disponivel' },
  { value: 'indisponivel', label: 'Indisponivel' },
];

export const FREQUENCIA_STATUS_OPTIONS: CrudOption[] = [
  { value: 'presente', label: 'Presente' },
  { value: 'falta_justificada', label: 'Falta justificada' },
  { value: 'falta_injustificada', label: 'Falta injustificada' },
];

export const TIPO_PAGAMENTO_OPTIONS: CrudOption[] = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'por_hora', label: 'Por hora' },
];
