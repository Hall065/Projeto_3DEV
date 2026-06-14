export type ChamadoPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';
export type ChamadoStatus =
  | 'aberto'
  | 'aguardando'
  | 'em_andamento'
  | 'em_atendimento'
  | 'concluido'
  | 'concluida'
  | 'cancelado';
export type TarefaStatus = 'a_fazer' | 'em_andamento' | 'concluida' | 'concluido' | 'cancelado';

export interface Chamado {
  id: string;
  codigo: string;
  solicitante_id: string;
  titulo: string;
  descricao: string;
  sala_id?: string | null;
  bloco_id?: string | null;
  categoria_id?: string | null;
  prioridade: ChamadoPrioridade;
  status: ChamadoStatus;
  aberto_por?: string | null;
  responsavel_id?: string | null;
  item_atribuido_id?: string | null;
  resumo?: string | null;
  sala_texto?: string | null;
  bloco_texto?: string | null;
  criado_em?: string;
  concluido_em?: string | null;
  iniciado_em?: string | null;
  resumo_resolucao?: string | null;
  descricao_corrigida?: string | null;
  consideracoes?: string | null;
  avaliacao_nota?: number | null;
  avaliacao_observacao?: string | null;
  avaliado_por?: string | null;
  avaliado_em?: string | null;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  observacoes_aprovacao?: string | null;
  // Campos auxiliares para UI
  solicitante_nome?: string;
  responsavel_nome?: string;
  sala_nome?: string;
  bloco_nome?: string;
  categoria_nome?: string;
  item_nome?: string;
  created_at?: string; // fallback
  data_abertura?: string | null;
  data_fechamento?: string | null;
  anexos?: ChamadoAnexo[];
  imagem_url?: string | null;
  evidencia_url?: string | null;
}

export interface ChamadoAnexo {
  id: string;
  chamado_id: string;
  arquivo_id?: string | null;
  url?: string | null;
  tipo?: 'abertura' | 'evidencia_conclusao' | string | null;
  created_at?: string | null;
}

export interface Tarefa {
  id: string;
  chamado_id: string;
  codigo?: string | null;
  aberto_por?: string | null;
  responsavel_id?: string | null;
  item_id?: string | null;
  status: TarefaStatus;
  coluna?: string | null;
  status_label?: string | null;
  inicio_reparo?: string | null;
  fim_reparo?: string | null;
  data_inicio_reparo?: string | null;
  data_termino_reparo?: string | null;
  aberto_em?: string | null;
  concluido_em?: string | null;
  observacoes?: string | null;
  observacao?: string | null;
  criado_em?: string;
  created_at?: string;
  items?: unknown[];
  inventory_items?: unknown[];
  // Campos auxiliares para UI
  chamado_codigo?: string;
  chamado_status?: ChamadoStatus;
  titulo: string;
  descricao?: string;
  prioridade?: ChamadoPrioridade;
  responsavel_nome?: string;
  sala_nome?: string;
  bloco_nome?: string;
  item_nome?: string;
}

export interface ItemEstoque {
  id: string;
  categoria_id?: string | null;
  fornecedor_id?: string | null;
  titulo: string;
  descricao: string;
  quantidade_disponivel: number;
  quantidade_minima: number;
  unidade: string;
  localizacao: string;
  empresa_distribuidora?: string | null;
  custo: number | null;
  status: 'disponivel' | 'indisponivel' | 'estoque_baixo' | 'reservado' | 'esgotado';
  criado_em?: string;
  // Campos auxiliares para UI
  categoria_nome?: string;
  fornecedor_nome?: string;
}

export interface GridCategoria {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
  status?: string | null;
  criado_em?: string;
}

export interface GridFornecedor {
  id: string;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: string | null;
}
