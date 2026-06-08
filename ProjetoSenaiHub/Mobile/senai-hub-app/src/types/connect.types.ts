export type AlunoStatus = 'ativo' | 'inativo' | 'bloqueado' | 'pendente';

export interface Aluno {
  id: string;
  usuario_id?: string | null;
  curso_id?: string | null;
  turma_id?: string | null;
  foto_arquivo_id?: string | null;
  foto_url?: string | null;
  rm: string;
  nome: string;
  email_pessoal?: string | null;
  email_institucional?: string | null;
  empresa_nome?: string | null;
  data_nascimento?: string | null;
  nome_responsavel?: string | null;
  status: AlunoStatus;
  email?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  turma_nome?: string;
  curso_nome?: string;
}

export interface Professor {
  id: string;
  usuario_id?: string | null;
  nome: string;
  especialidade?: string | null;
  data_contratacao?: string | null;
  data_nascimento?: string | null;
  endereco?: string | null;
  status: AlunoStatus;
  email?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  celular?: string | null;
}

export type TurmaPeriodo = 'manha' | 'tarde' | 'noite' | 'integral';

export interface Turma {
  id: string;
  curso_id?: string | null;
  professor_responsavel_id?: string | null;
  sala_id?: string | null;
  nome: string;
  periodo?: TurmaPeriodo | string | null;
  data_inicio?: string | null;
  data_termino?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  status: string;
  curso_nome?: string | null;
  professor_nome?: string | null;
}

export interface Curso {
  id: string;
  nome: string;
  descricao?: string | null;
  modalidade?: string | null;
  periodo?: TurmaPeriodo | string | null;
  carga_horaria?: number | null;
  data_inicio?: string | null;
  data_termino?: string | null;
  status: string;
}

export type FrequenciaStatus = 'P' | 'FJ' | 'FI' | 'presente' | 'falta_justificada' | 'falta_injustificada';

export interface FrequenciaRegistro {
  id: string;
  aula_id?: string | null;
  aluno_id: string;
  status: FrequenciaStatus;
  observacao?: string | null;
  justificativa?: string | null;
  quantidade_aulas_faltadas?: number | null;
  aluno_nome?: string | null;
  turma_nome?: string | null;
  data_aula?: string | null;
  data?: string | null;
  disciplina?: string | null;
  professor_id?: string | null;
  turma_id?: string | null;
}

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  responsavel_nome?: string | null;
  status?: string | null;
  usuario_id?: string | null;
}

export interface ContratoAluno {
  id: string;
  aluno_id: string;
  empresa_id?: string | null;
  empresa_nome?: string | null;
  carga_horaria?: string | null;
  carteira_trabalho?: string | null;
  conta_bancaria?: string | null;
  localizacao_empresa?: string | null;
  email_empresa?: string | null;
  arquivo_id?: string | null;
  data_inicio?: string | null;
  data_termino?: string | null;
  data_fim?: string | null;
  status?: string | null;
  aluno_nome?: string | null;
  arquivo_url?: string;
}

export interface SalarioAluno {
  id: string;
  aluno_id: string;
  empresa_id?: string | null;
  contrato_id?: string | null;
  mes?: string | null;
  mes_referencia?: string | null;
  tipo_pagamento?: string | null;
  salario_base: number;
  valor_hora?: number | null;
  carga_diaria_horas?: number | null;
  dias_uteis_mes?: number | null;
  outros_descontos?: number | null;
  salario_final?: number | null;
  valor_dia?: number | null;
  desconto?: number | null;
  frequencia_percentual?: number | null;
  dias_trabalhados?: number | null;
  faltas_injustificadas?: number | null;
  aluno_nome?: string | null;
  empresa_nome?: string | null;
}

export interface LocalizacaoAluno {
  id?: string;
  aluno_id: string;
  latitude: number | null;
  longitude: number | null;
  dentro_do_senai?: boolean | null;
  dentro_perimetro?: boolean | null;
  em_aula?: boolean | null;
  turma_id?: string | null;
  turma_nome?: string | null;
  curso_id?: string | null;
  curso_nome?: string | null;
  email_institucional?: string | null;
  atualizado_em?: string | null;
  data_hora?: string | null;
  precisao_metros?: number | null;
  aluno_nome?: string | null;
}
