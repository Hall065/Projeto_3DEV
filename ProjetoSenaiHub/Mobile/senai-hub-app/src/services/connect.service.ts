import { supabase } from '@/lib/supabase';
import { createAuthUserProfile } from '@/services/user-profile.service';
import type {
  Aluno,
  ContratoAluno,
  Curso,
  Empresa,
  FrequenciaRegistro,
  LocalizacaoAluno,
  Professor,
  SalarioAluno,
  Turma,
} from '@/types/connect.types';

const schema = 'connect';
type FormValues = Record<string, string>;
type Row = Record<string, any>;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nullIfEmpty(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uuidOrNull(value: string | null | undefined, label: string) {
  const normalized = nullIfEmpty(value);
  if (!normalized) return null;
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error(`Selecione um ${label} valido.`);
  }
  return normalized;
}

function requiredUuid(value: string | null | undefined, label: string) {
  const uuid = uuidOrNull(value, label);
  if (!uuid) {
    throw new Error(`Selecione um ${label}.`);
  }
  return uuid;
}

function numberOrZero(value?: string | number | null) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value?: string | null, fallback = 'ativo') {
  return nullIfEmpty(value)?.toLowerCase().replace(/\s+/g, '_') ?? fallback;
}

function relation(row: Row, key: string) {
  const value = row[key];
  return Array.isArray(value) ? value[0] : value;
}

async function selectRows(table: string, select = '*'): Promise<Row[]> {
  const { data, error } = await supabase.schema(schema).from(table).select(select);
  if (error) {
    const fallback = await supabase.schema(schema).from(table).select('*');
    if (fallback.error) throw error;
    return (fallback.data ?? []) as Row[];
  }
  return (data ?? []) as Row[];
}

function uniqueIds(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function indexById(rows: Row[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function selectRowsByIds(table: string, ids: string[], select = '*'): Promise<Row[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.schema(schema).from(table).select(select).in('id', ids);
  if (error) throw error;
  return (data ?? []) as Row[];
}

async function selectHubRowsByIds(table: string, ids: string[], select = '*'): Promise<Row[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.schema('hub').from(table).select(select).in('id', ids);
  if (error) throw error;
  return (data ?? []) as Row[];
}

async function hydrateProfessores(rows: Row[]) {
  const usuarios = indexById(
    await selectHubRowsByIds(
      'usuarios',
      uniqueIds(rows.map((row) => row.usuario_id)),
      'id,nome,email,email_institucional,cpf,telefone'
    )
  );

  return rows.map((row) => ({
    ...row,
    usuario: row.usuario ?? usuarios.get(row.usuario_id),
  }));
}

async function hydrateTurmas(rows: Row[]) {
  const cursos = indexById(await selectRowsByIds('cursos', uniqueIds(rows.map((row) => row.curso_id)), 'id,nome'));
  const professores = indexById(
    await hydrateProfessores(
      await selectRowsByIds(
        'professores',
        uniqueIds(rows.map((row) => row.professor_responsavel_id)),
        '*'
      )
    )
  );

  return rows.map((row) => ({
    ...row,
    curso: row.curso ?? cursos.get(row.curso_id),
    professor: row.professor ?? professores.get(row.professor_responsavel_id),
  }));
}

async function hydrateAlunos(rows: Row[]) {
  const usuarios = indexById(
    await selectHubRowsByIds(
      'usuarios',
      uniqueIds(rows.map((row) => row.usuario_id)),
      'id,nome,email,email_institucional,cpf,telefone'
    )
  );
  const cursos = indexById(await selectRowsByIds('cursos', uniqueIds(rows.map((row) => row.curso_id)), 'id,nome'));
  const turmas = indexById(await selectRowsByIds('turmas', uniqueIds(rows.map((row) => row.turma_id)), 'id,nome'));

  return rows.map((row) => ({
    ...row,
    usuario: row.usuario ?? usuarios.get(row.usuario_id),
    curso: row.curso ?? cursos.get(row.curso_id),
    turma: row.turma ?? turmas.get(row.turma_id),
  }));
}

async function hydrateContratos(rows: Row[]) {
  const alunos = indexById(
    await hydrateAlunos(await selectRowsByIds('alunos', uniqueIds(rows.map((row) => row.aluno_id)), '*'))
  );
  const empresas = indexById(await selectRowsByIds('empresas', uniqueIds(rows.map((row) => row.empresa_id)), 'id,nome'));

  return rows.map((row) => ({
    ...row,
    aluno: row.aluno ?? alunos.get(row.aluno_id),
    empresa: row.empresa ?? empresas.get(row.empresa_id),
  }));
}

async function hydrateFrequencias(rows: Row[]) {
  const alunos = indexById(
    await hydrateAlunos(await selectRowsByIds('alunos', uniqueIds(rows.map((row) => row.aluno_id)), '*'))
  );
  const aulas = await selectRowsByIds('aulas', uniqueIds(rows.map((row) => row.aula_id)), '*');
  const turmas = indexById(await selectRowsByIds('turmas', uniqueIds(aulas.map((aula) => aula.turma_id)), 'id,nome'));
  const aulasById = indexById(
    aulas.map((aula) => ({
      ...aula,
      turma: turmas.get(aula.turma_id),
    }))
  );

  return rows.map((row) => ({
    ...row,
    aluno: row.aluno ?? alunos.get(row.aluno_id),
    aula: row.aula ?? aulasById.get(row.aula_id),
  }));
}

async function insertWithFallback(table: string, payloads: Row[]) {
  let lastError: unknown = null;
  for (const payload of payloads) {
    const { data, error } = await supabase.schema(schema).from(table).insert(payload).select('*').single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

async function updateWithFallback(table: string, id: string, payloads: Row[]) {
  let lastError: unknown = null;
  for (const payload of payloads) {
    const { data, error } = await supabase
      .schema(schema)
      .from(table)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

async function deleteRow(table: string, id: string) {
  const { error } = await supabase.schema(schema).from(table).delete().eq('id', id);
  if (error) throw error;
}

async function createHubUser(values: FormValues, tipoUsuario: string) {
  return createAuthUserProfile({
    nome: nullIfEmpty(values.nome) ?? 'Sem nome',
    email: nullIfEmpty(values.email) ?? '',
    senha: nullIfEmpty(values.senha),
    tipoUsuario,
    telefone: nullIfEmpty(values.telefone ?? values.celular),
    cpf: nullIfEmpty(values.cpf),
    status: normalizeStatus(values.status),
  });
}

async function updateHubUser(usuarioId: string | null | undefined, values: FormValues) {
  if (!usuarioId) return;
  const base = {
    nome: nullIfEmpty(values.nome),
    email_institucional: nullIfEmpty(values.email),
    telefone: nullIfEmpty(values.telefone ?? values.celular),
    cpf: nullIfEmpty(values.cpf),
    status: nullIfEmpty(values.status),
  };
  const payload = Object.fromEntries(Object.entries(base).filter(([, value]) => value !== null));

  await supabase.schema('hub').from('usuarios').update(payload).eq('id', usuarioId);
}

function mapAluno(row: Row): Aluno {
  const usuario = relation(row, 'usuario') ?? relation(row, 'usuarios') ?? {};
  const turma = relation(row, 'turma') ?? relation(row, 'turmas') ?? {};
  const curso = relation(row, 'curso') ?? relation(row, 'cursos') ?? {};

  return {
    id: row.id,
    usuario_id: row.usuario_id,
    nome: row.nome ?? usuario.nome ?? 'Aluno sem nome',
    email: row.email_institucional ?? usuario.email_institucional ?? usuario.email,
    email_institucional: row.email_institucional ?? usuario.email_institucional ?? usuario.email,
    email_pessoal: row.email_pessoal,
    rm: row.rm,
    cpf: row.cpf ?? usuario.cpf,
    telefone: row.telefone ?? usuario.telefone,
    status: row.status ?? 'ativo',
    data_nascimento: row.data_nascimento,
    nome_responsavel: row.nome_responsavel,
    turma_id: row.turma_id,
    turma_nome: row.turma_nome ?? turma.nome,
    curso_id: row.curso_id,
    curso_nome: row.curso_nome ?? curso.nome,
    empresa_nome: row.empresa_nome,
  };
}

function mapProfessor(row: Row): Professor {
  const usuario = relation(row, 'usuario') ?? relation(row, 'usuarios') ?? {};
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    nome: row.nome ?? usuario.nome ?? 'Professor sem nome',
    email: row.email ?? usuario.email_institucional ?? usuario.email,
    cpf: row.cpf ?? usuario.cpf,
    status: row.status ?? 'ativo',
    especialidade: row.especialidade ?? row.tempo_contrato,
    celular: row.celular ?? usuario.telefone,
    data_contratacao: row.data_contratacao,
    data_nascimento: row.data_nascimento,
    endereco: row.endereco,
  };
}

function mapCurso(row: Row): Curso {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    modalidade: row.modalidade,
    status: row.status ?? 'ativo',
    periodo: row.periodo,
    carga_horaria: row.carga_horaria,
    data_inicio: row.data_inicio,
    data_termino: row.data_termino,
  };
}

function mapTurma(row: Row): Turma {
  const curso = relation(row, 'curso') ?? relation(row, 'cursos') ?? {};
  const professor = relation(row, 'professor') ?? relation(row, 'professores') ?? {};
  const professorUsuario = relation(professor, 'usuario') ?? relation(professor, 'usuarios') ?? {};
  return {
    id: row.id,
    nome: row.nome,
    curso_id: row.curso_id,
    curso_nome: row.curso_nome ?? curso.nome,
    status: row.status ?? 'ativa',
    periodo: row.periodo,
    professor_responsavel_id: row.professor_responsavel_id,
    professor_nome: row.professor_nome ?? professor.nome ?? professorUsuario.nome,
    data_inicio: row.data_inicio,
    data_termino: row.data_termino,
    horario_inicio: row.horario_inicio,
    horario_fim: row.horario_fim,
  };
}

function mapEmpresa(row: Row): Empresa {
  return {
    id: row.id,
    nome: row.nome,
    cnpj: row.cnpj,
    email: row.email,
    telefone: row.telefone,
    responsavel_nome: row.responsavel_nome,
    status: row.status,
  };
}

function mapContrato(row: Row): ContratoAluno {
  const aluno = relation(row, 'aluno') ?? relation(row, 'alunos') ?? {};
  const empresa = relation(row, 'empresa') ?? relation(row, 'empresas') ?? {};
  const usuario = relation(aluno, 'usuario') ?? {};
  return {
    id: row.id,
    aluno_id: row.aluno_id,
    aluno_nome: row.aluno_nome ?? aluno.nome ?? usuario.nome,
    empresa_id: row.empresa_id,
    empresa_nome: row.empresa_nome ?? empresa.nome,
    carga_horaria: row.carga_horaria,
    carteira_trabalho: row.carteira_trabalho,
    conta_bancaria: row.conta_bancaria,
    localizacao_empresa: row.localizacao_empresa,
    email_empresa: row.email_empresa,
    data_inicio: row.data_inicio,
    data_termino: row.data_termino,
    status: row.status,
  };
}

function mapSalario(row: Row): SalarioAluno {
  const aluno = relation(row, 'aluno') ?? relation(row, 'alunos') ?? {};
  const empresa = relation(row, 'empresa') ?? relation(row, 'empresas') ?? {};
  const usuario = relation(aluno, 'usuario') ?? {};
  return {
    id: row.id,
    aluno_id: row.aluno_id,
    aluno_nome: row.aluno_nome ?? aluno.nome ?? usuario.nome,
    empresa_id: row.empresa_id,
    empresa_nome: row.empresa_nome ?? empresa.nome,
    contrato_id: row.contrato_id,
    tipo_pagamento: row.tipo_pagamento,
    salario_base: Number(row.salario_base ?? 0),
    valor_hora: row.valor_hora == null ? null : Number(row.valor_hora),
    carga_diaria_horas: row.carga_diaria_horas == null ? null : Number(row.carga_diaria_horas),
    dias_uteis_mes: row.dias_uteis_mes,
    mes_referencia: row.mes_referencia,
    salario_final: row.salario_final == null ? null : Number(row.salario_final),
    faltas_injustificadas: row.faltas_injustificadas,
  };
}

function mapFrequencia(row: Row): FrequenciaRegistro {
  const aluno = relation(row, 'aluno') ?? relation(row, 'alunos') ?? {};
  const usuario = relation(aluno, 'usuario') ?? {};
  const aula = relation(row, 'aula') ?? relation(row, 'aulas') ?? {};
  const turma = relation(aula, 'turma') ?? {};
  return {
    id: row.id,
    aluno_id: row.aluno_id,
    aula_id: row.aula_id,
    data: row.data ?? aula.data_aula,
    data_aula: aula.data_aula,
    status: row.status,
    quantidade_aulas_faltadas: row.quantidade_aulas_faltadas,
    aluno_nome: row.aluno_nome ?? aluno.nome ?? usuario.nome,
    turma_nome: turma.nome,
  };
}

function mapLocalizacao(row: Row): LocalizacaoAluno {
  const aluno = relation(row, 'aluno') ?? relation(row, 'alunos') ?? {};
  const usuario = relation(aluno, 'usuario') ?? {};
  return {
    id: row.id ?? row.aluno_id,
    aluno_id: row.aluno_id,
    aluno_nome: row.aluno_nome ?? aluno.nome ?? usuario.nome,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    dentro_perimetro: row.dentro_perimetro,
    em_aula: row.em_aula,
    data_hora: row.data_hora,
    precisao_metros: row.precisao_metros == null ? null : Number(row.precisao_metros),
  };
}

export const connectService = {
  async listAlunos(): Promise<Aluno[]> {
    const rows = await hydrateAlunos(await selectRows('alunos'));
    return rows.map(mapAluno);
  },

  async createAluno(values: FormValues) {
    const cursoId = uuidOrNull(values.curso_id, 'curso');
    const turmaId = uuidOrNull(values.turma_id, 'turma');
    const usuarioId = await createHubUser(values, 'aluno');
    return insertWithFallback('alunos', [
      {
        usuario_id: usuarioId,
        curso_id: cursoId,
        turma_id: turmaId,
        rm: nullIfEmpty(values.rm) ?? `${Date.now()}`,
        email_pessoal: nullIfEmpty(values.email_pessoal),
        email_institucional: nullIfEmpty(values.email),
        empresa_nome: nullIfEmpty(values.empresa_nome),
        data_nascimento: nullIfEmpty(values.data_nascimento),
        nome_responsavel: nullIfEmpty(values.nome_responsavel),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  async updateAluno(id: string, values: FormValues) {
    const { data } = await supabase.schema(schema).from('alunos').select('usuario_id').eq('id', id).single();
    const cursoId = uuidOrNull(values.curso_id, 'curso');
    const turmaId = uuidOrNull(values.turma_id, 'turma');
    await updateHubUser((data as Row | null)?.usuario_id, values);
    return updateWithFallback('alunos', id, [
      {
        curso_id: cursoId,
        turma_id: turmaId,
        rm: nullIfEmpty(values.rm),
        email_pessoal: nullIfEmpty(values.email_pessoal),
        email_institucional: nullIfEmpty(values.email),
        empresa_nome: nullIfEmpty(values.empresa_nome),
        data_nascimento: nullIfEmpty(values.data_nascimento),
        nome_responsavel: nullIfEmpty(values.nome_responsavel),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  deleteAluno: (id: string) => deleteRow('alunos', id),

  async listProfessores(): Promise<Professor[]> {
    const rows = await hydrateProfessores(await selectRows('professores'));
    return rows.map(mapProfessor);
  },

  async createProfessor(values: FormValues) {
    const usuarioId = await createHubUser(values, 'professor');
    return insertWithFallback('professores', [
      {
        usuario_id: usuarioId,
        especialidade: nullIfEmpty(values.especialidade),
        data_contratacao: nullIfEmpty(values.data_contratacao),
        data_nascimento: nullIfEmpty(values.data_nascimento),
        celular: nullIfEmpty(values.celular),
        endereco: nullIfEmpty(values.endereco),
        tempo_contrato: nullIfEmpty(values.especialidade),
        status: normalizeStatus(values.status),
      },
      {
        nome: nullIfEmpty(values.nome),
        email: nullIfEmpty(values.email),
        cpf: nullIfEmpty(values.cpf),
        celular: nullIfEmpty(values.celular),
        especialidade: nullIfEmpty(values.especialidade),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  async updateProfessor(id: string, values: FormValues) {
    const { data } = await supabase.schema(schema).from('professores').select('usuario_id').eq('id', id).single();
    await updateHubUser((data as Row | null)?.usuario_id, values);
    return updateWithFallback('professores', id, [
      {
        especialidade: nullIfEmpty(values.especialidade),
        data_contratacao: nullIfEmpty(values.data_contratacao),
        data_nascimento: nullIfEmpty(values.data_nascimento),
        celular: nullIfEmpty(values.celular),
        endereco: nullIfEmpty(values.endereco),
        tempo_contrato: nullIfEmpty(values.especialidade),
        status: normalizeStatus(values.status),
      },
      {
        nome: nullIfEmpty(values.nome),
        email: nullIfEmpty(values.email),
        cpf: nullIfEmpty(values.cpf),
        celular: nullIfEmpty(values.celular),
        especialidade: nullIfEmpty(values.especialidade),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  deleteProfessor: (id: string) => deleteRow('professores', id),

  async listCursos(): Promise<Curso[]> {
    const rows = await selectRows('cursos');
    return rows.map(mapCurso);
  },

  createCurso(values: FormValues) {
    return insertWithFallback('cursos', [
      {
        nome: nullIfEmpty(values.nome),
        descricao: nullIfEmpty(values.descricao),
        modalidade: normalizeStatus(values.modalidade, 'tecnico'),
        periodo: normalizeStatus(values.periodo, 'manha'),
        carga_horaria: numberOrZero(values.carga_horaria),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  updateCurso(id: string, values: FormValues) {
    return updateWithFallback('cursos', id, [
      {
        nome: nullIfEmpty(values.nome),
        descricao: nullIfEmpty(values.descricao),
        modalidade: normalizeStatus(values.modalidade, 'tecnico'),
        periodo: normalizeStatus(values.periodo, 'manha'),
        carga_horaria: numberOrZero(values.carga_horaria),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  deleteCurso: (id: string) => deleteRow('cursos', id),

  async listTurmas(): Promise<Turma[]> {
    const rows = await hydrateTurmas(await selectRows('turmas'));
    return rows.map(mapTurma);
  },

  createTurma(values: FormValues) {
    return insertWithFallback('turmas', [
      {
        nome: nullIfEmpty(values.nome),
        curso_id: uuidOrNull(values.curso_id, 'curso'),
        professor_responsavel_id: uuidOrNull(values.professor_responsavel_id, 'professor'),
        periodo: normalizeStatus(values.periodo, 'manha'),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        horario_inicio: nullIfEmpty(values.horario_inicio),
        horario_fim: nullIfEmpty(values.horario_fim),
        status: normalizeStatus(values.status, 'ativa'),
      },
    ]);
  },

  updateTurma(id: string, values: FormValues) {
    return updateWithFallback('turmas', id, [
      {
        nome: nullIfEmpty(values.nome),
        curso_id: uuidOrNull(values.curso_id, 'curso'),
        professor_responsavel_id: uuidOrNull(values.professor_responsavel_id, 'professor'),
        periodo: normalizeStatus(values.periodo, 'manha'),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        horario_inicio: nullIfEmpty(values.horario_inicio),
        horario_fim: nullIfEmpty(values.horario_fim),
        status: normalizeStatus(values.status, 'ativa'),
      },
    ]);
  },

  deleteTurma: (id: string) => deleteRow('turmas', id),

  async listEmpresas(): Promise<Empresa[]> {
    const rows = await selectRows('empresas');
    return rows.map(mapEmpresa);
  },

  createEmpresa(values: FormValues) {
    return insertWithFallback('empresas', [
      {
        nome: nullIfEmpty(values.nome),
        cnpj: nullIfEmpty(values.cnpj),
        email: nullIfEmpty(values.email),
        telefone: nullIfEmpty(values.telefone),
        responsavel_nome: nullIfEmpty(values.responsavel_nome),
        status: normalizeStatus(values.status, 'ativa'),
      },
    ]);
  },

  updateEmpresa(id: string, values: FormValues) {
    return updateWithFallback('empresas', id, [
      {
        nome: nullIfEmpty(values.nome),
        cnpj: nullIfEmpty(values.cnpj),
        email: nullIfEmpty(values.email),
        telefone: nullIfEmpty(values.telefone),
        responsavel_nome: nullIfEmpty(values.responsavel_nome),
        status: normalizeStatus(values.status, 'ativa'),
      },
    ]);
  },

  deleteEmpresa: (id: string) => deleteRow('empresas', id),

  async listContratos(): Promise<ContratoAluno[]> {
    const rows = await hydrateContratos(await selectRows('contratos_alunos'));
    return rows.map(mapContrato);
  },

  createContrato(values: FormValues) {
    return insertWithFallback('contratos_alunos', [
      {
        aluno_id: requiredUuid(values.aluno_id, 'aluno'),
        empresa_id: uuidOrNull(values.empresa_id, 'empresa'),
        carteira_trabalho: nullIfEmpty(values.carteira_trabalho),
        conta_bancaria: nullIfEmpty(values.conta_bancaria),
        carga_horaria: nullIfEmpty(values.carga_horaria) ?? '6h',
        localizacao_empresa: nullIfEmpty(values.localizacao_empresa),
        email_empresa: nullIfEmpty(values.email_empresa),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  updateContrato(id: string, values: FormValues) {
    return updateWithFallback('contratos_alunos', id, [
      {
        aluno_id: requiredUuid(values.aluno_id, 'aluno'),
        empresa_id: uuidOrNull(values.empresa_id, 'empresa'),
        carteira_trabalho: nullIfEmpty(values.carteira_trabalho),
        conta_bancaria: nullIfEmpty(values.conta_bancaria),
        carga_horaria: nullIfEmpty(values.carga_horaria) ?? '6h',
        localizacao_empresa: nullIfEmpty(values.localizacao_empresa),
        email_empresa: nullIfEmpty(values.email_empresa),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        status: normalizeStatus(values.status),
      },
    ]);
  },

  deleteContrato: (id: string) => deleteRow('contratos_alunos', id),

  async listSalarios(): Promise<SalarioAluno[]> {
    const rows = await hydrateContratos(await selectRows('salarios_alunos'));
    return rows.map(mapSalario);
  },

  createSalario(values: FormValues) {
    return insertWithFallback('salarios_alunos', [
      {
        aluno_id: requiredUuid(values.aluno_id, 'aluno'),
        empresa_id: uuidOrNull(values.empresa_id, 'empresa'),
        contrato_id: uuidOrNull(values.contrato_id, 'contrato'),
        tipo_pagamento: normalizeStatus(values.tipo_pagamento, 'mensal'),
        salario_base: numberOrZero(values.salario_base),
        valor_hora: numberOrZero(values.valor_hora),
        carga_diaria_horas: numberOrZero(values.carga_diaria_horas) || 6,
        dias_uteis_mes: numberOrZero(values.dias_uteis_mes) || 22,
        mes_referencia: nullIfEmpty(values.mes_referencia) ?? new Date().toISOString().slice(0, 7),
      },
    ]);
  },

  updateSalario(id: string, values: FormValues) {
    return updateWithFallback('salarios_alunos', id, [
      {
        aluno_id: requiredUuid(values.aluno_id, 'aluno'),
        empresa_id: uuidOrNull(values.empresa_id, 'empresa'),
        contrato_id: uuidOrNull(values.contrato_id, 'contrato'),
        tipo_pagamento: normalizeStatus(values.tipo_pagamento, 'mensal'),
        salario_base: numberOrZero(values.salario_base),
        valor_hora: numberOrZero(values.valor_hora),
        carga_diaria_horas: numberOrZero(values.carga_diaria_horas) || 6,
        dias_uteis_mes: numberOrZero(values.dias_uteis_mes) || 22,
        mes_referencia: nullIfEmpty(values.mes_referencia) ?? new Date().toISOString().slice(0, 7),
      },
    ]);
  },

  deleteSalario: (id: string) => deleteRow('salarios_alunos', id),

  async listFrequencias(): Promise<FrequenciaRegistro[]> {
    const rows = await hydrateFrequencias(await selectRows('frequencias'));
    return rows.map(mapFrequencia);
  },

  async createFrequencia(values: FormValues, registradoPor?: string | null) {
    const alunoId = requiredUuid(values.aluno_id, 'aluno');
    const { data: aula, error: aulaError } = await supabase
      .schema(schema)
      .from('aulas')
      .insert({
        turma_id: uuidOrNull(values.turma_id, 'turma'),
        professor_id: uuidOrNull(values.professor_id, 'professor'),
        disciplina: nullIfEmpty(values.disciplina) ?? 'Aula',
        data_aula: nullIfEmpty(values.data_aula) ?? new Date().toISOString().slice(0, 10),
        quantidade_aulas: numberOrZero(values.quantidade_aulas) || 1,
        observacao: nullIfEmpty(values.observacao),
      })
      .select('id')
      .single();
    if (aulaError) throw aulaError;

    return insertWithFallback('frequencias', [
      {
        aula_id: aula.id,
        aluno_id: alunoId,
        status: normalizeStatus(values.status, 'presente'),
        quantidade_aulas_faltadas: numberOrZero(values.quantidade_aulas_faltadas),
        justificativa: nullIfEmpty(values.justificativa),
        registrado_por: uuidOrNull(registradoPor, 'usuario'),
      },
    ]);
  },

  updateFrequencia(id: string, values: FormValues) {
    return updateWithFallback('frequencias', id, [
      {
        aluno_id: requiredUuid(values.aluno_id, 'aluno'),
        status: normalizeStatus(values.status, 'presente'),
        quantidade_aulas_faltadas: numberOrZero(values.quantidade_aulas_faltadas),
        justificativa: nullIfEmpty(values.justificativa),
      },
    ]);
  },

  deleteFrequencia: (id: string) => deleteRow('frequencias', id),

  async listLocalizacoes(): Promise<LocalizacaoAluno[]> {
    const rows = await hydrateContratos(await selectRows('localizacoes_alunos'));
    return rows.map(mapLocalizacao);
  },

  async listAlunoOptions() {
    const alunos = await connectService.listAlunos();
    return alunos.map((aluno) => ({
      value: aluno.id,
      label: aluno.nome,
      description: aluno.rm ? `RM ${aluno.rm}` : aluno.email ?? undefined,
    }));
  },

  async listProfessorOptions() {
    const professores = await connectService.listProfessores();
    return professores.map((professor) => ({
      value: professor.id,
      label: professor.nome,
      description: professor.especialidade ?? professor.email ?? undefined,
    }));
  },

  async listCursoOptions() {
    const cursos = await connectService.listCursos();
    return cursos.map((curso) => ({
      value: curso.id,
      label: curso.nome,
      description: curso.periodo ?? undefined,
    }));
  },

  async listTurmaOptions() {
    const turmas = await connectService.listTurmas();
    return turmas.map((turma) => ({
      value: turma.id,
      label: turma.nome,
      description: turma.curso_nome ?? turma.periodo ?? undefined,
    }));
  },

  async listEmpresaOptions() {
    const empresas = await connectService.listEmpresas();
    return empresas.map((empresa) => ({
      value: empresa.id,
      label: empresa.nome,
      description: empresa.cnpj ?? empresa.email ?? undefined,
    }));
  },

  async listContratoOptions() {
    const contratos = await connectService.listContratos();
    return contratos.map((contrato) => ({
      value: contrato.id,
      label: contrato.aluno_nome ?? contrato.empresa_nome ?? contrato.id,
      description: contrato.empresa_nome ?? contrato.status ?? undefined,
    }));
  },

  async getDashboardMetrics() {
    const [alunos, professores, turmas, cursos] = await Promise.all([
      supabase.schema(schema).from('alunos').select('id', { count: 'exact', head: true }),
      supabase.schema(schema).from('professores').select('id', { count: 'exact', head: true }),
      supabase.schema(schema).from('turmas').select('id', { count: 'exact', head: true }),
      supabase.schema(schema).from('cursos').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalAlunos: alunos.count ?? 0,
      totalProfessores: professores.count ?? 0,
      totalTurmas: turmas.count ?? 0,
      totalCursos: cursos.count ?? 0,
    };
  },
};
