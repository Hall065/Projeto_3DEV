import { supabase } from '@/lib/supabase';
import { createAuthUserProfile, deleteAuthUserProfile } from '@/services/user-profile.service';
import { updateUserPhoto } from '@/services/hub.service';
import { uploadService } from '@/services/upload.service';
import type {
  Aluno,
  ContratoAluno,
  Curso,
  Empresa,
  FrequenciaRegistro,
  LocalizacaoAluno,
  Professor,
  SalaryPreviewData,
  SalarioAluno,
  Turma,
} from '@/types/connect.types';

const schema = 'connect';
type FormValues = Record<string, string>;
type Row = Record<string, any>;
// O banco do projeto possui UUIDs semeados sem bits RFC de versao/variante.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeReferenceMonth(value?: string | null) {
  const month = nullIfEmpty(value) ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Selecione um mes de referencia valido.');
  }
  return month;
}

function normalizeStatus(value?: string | null, fallback = 'ativo') {
  return nullIfEmpty(value)?.toLowerCase().replace(/\s+/g, '_') ?? fallback;
}

function normalizeAttendanceStatus(
  value?: string | null
): 'presente' | 'falta_justificada' | 'falta_injustificada' {
  const status = normalizeStatus(value, 'presente');
  if (['fj', 'justified', 'falta_justificada'].includes(status)) {
    return 'falta_justificada';
  }
  if (['fi', 'absent', 'falta_injustificada'].includes(status)) {
    return 'falta_injustificada';
  }
  return 'presente';
}

function relation(row: Row, key: string) {
  const value = row[key];
  return Array.isArray(value) ? value[0] : value;
}

function isSupabasePermissionError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const supabaseError = error as { code?: string; status?: number; message?: string };
  const message = supabaseError.message?.toLowerCase() ?? '';
  return (
    supabaseError.status === 401 ||
    supabaseError.status === 403 ||
    supabaseError.code === '42501' ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  );
}

function getSupabaseErrorMessage(error: unknown, table: string, action = 'salvar') {
  if (isSupabasePermissionError(error)) {
    return `Sem permissao para ${action} em connect.${table}. Entre com uma conta autenticada e verifique as policies RLS do banco.`;
  }
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) return message;
  }
  return `Nao foi possivel ${action} em connect.${table}.`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) return message;
  }
  return fallback;
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

async function countRows(table: string) {
  try {
    return (await selectRows(table, 'id')).length;
  } catch {
    return 0;
  }
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
      'id,nome,email,email_institucional,cpf,telefone,foto_arquivo_id,foto_url'
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
  let fotos = new Map<string, Row>();
  try {
    fotos = indexById(
      await selectHubRowsByIds('arquivos', uniqueIds(rows.map((row) => row.foto_arquivo_id)), 'id,url_segura')
    );
  } catch {
    fotos = new Map();
  }

  let contratosByAluno = new Map<string, Row>();
  let empresas = new Map<string, Row>();
  const alunoIds = uniqueIds(rows.map((row) => row.id));

  if (alunoIds.length > 0) {
    try {
      const { data: contratosData, error: contratosError } = await supabase
        .schema(schema)
        .from('contratos_alunos')
        .select('*')
        .in('aluno_id', alunoIds)
        .order('created_at', { ascending: false });
      if (contratosError) throw contratosError;

      const contratos = (contratosData ?? []) as Row[];
      contratosByAluno = contratos.reduce<Map<string, Row>>((map, contrato) => {
        const current = map.get(contrato.aluno_id);
        const currentActive = current?.status === 'ativo';
        if (!current || (!currentActive && contrato.status === 'ativo')) {
          map.set(contrato.aluno_id, contrato);
        }
        return map;
      }, new Map<string, Row>());

      empresas = indexById(
        await selectRowsByIds(
          'empresas',
          uniqueIds(contratos.map((contrato) => contrato.empresa_id)),
          '*'
        )
      );
    } catch {
      contratosByAluno = new Map();
      empresas = new Map();
    }
  }

  return rows.map((row) => {
    const contrato = contratosByAluno.get(row.id);
    const empresa = contrato?.empresa_id ? empresas.get(contrato.empresa_id) : undefined;
    return {
      ...row,
      usuario: row.usuario ?? usuarios.get(row.usuario_id),
      curso: row.curso ?? cursos.get(row.curso_id),
      turma: row.turma ?? turmas.get(row.turma_id),
      foto: row.foto ?? fotos.get(row.foto_arquivo_id),
      contrato,
      empresa,
      empresa_id: row.empresa_id ?? contrato?.empresa_id,
      empresa_nome: row.empresa_nome ?? contrato?.empresa_nome ?? empresa?.nome,
    };
  });
}

async function hydrateContratos(rows: Row[]) {
  const alunos = indexById(
    await hydrateAlunos(await selectRowsByIds('alunos', uniqueIds(rows.map((row) => row.aluno_id)), '*'))
  );
  const empresas = indexById(await selectRowsByIds('empresas', uniqueIds(rows.map((row) => row.empresa_id)), '*'));

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

async function hydrateLocalizacoes(rows: Row[]) {
  const alunos = indexById(
    await hydrateAlunos(await selectRowsByIds('alunos', uniqueIds(rows.map((row) => row.aluno_id)), '*'))
  );

  return rows.map((row) => ({
    ...row,
    aluno: row.aluno ?? alunos.get(row.aluno_id),
  }));
}

async function getAlunoUsuarioId(alunoId: string) {
  const { data, error } = await supabase
    .schema(schema)
    .from('alunos')
    .select('usuario_id')
    .eq('id', alunoId)
    .maybeSingle();

  if (error) return null;
  return ((data as Row | null)?.usuario_id as string | null | undefined) ?? null;
}

async function attachAlunoPhoto(
  alunoId: string,
  uri: string | null | undefined,
  enviadoPor?: string | null,
  usuarioId?: string | null
) {
  const imageUri = nullIfEmpty(uri);
  if (!imageUri || !enviadoPor || imageUri.startsWith('http')) return;

  try {
    const result = await uploadService.uploadAndSave(imageUri, enviadoPor, 'aluno', 'image', {
      tipo: 'aluno',
      id: alunoId,
    });

    await updateWithFallback('alunos', alunoId, [
      { foto_arquivo_id: result.arquivoId, foto_url: result.cloudinary.secure_url },
      { foto_arquivo_id: result.arquivoId },
      { foto_url: result.cloudinary.secure_url },
    ]);

    const targetUsuarioId = usuarioId ?? (await getAlunoUsuarioId(alunoId));
    if (targetUsuarioId) {
      await updateUserPhoto(targetUsuarioId, result.arquivoId, result.cloudinary.secure_url).catch((error) => {
        console.warn('[Connect] Foto do aluno enviada, mas o perfil do usuario nao foi atualizado:', error);
      });
    }
  } catch (error) {
    console.warn('[Connect] Nao foi possivel anexar a foto do aluno:', error);
  }
}

async function attachProfilePhoto(
  usuarioId: string | null | undefined,
  uri: string | null | undefined
) {
  const imageUri = nullIfEmpty(uri);
  if (!usuarioId || !imageUri || imageUri.startsWith('http')) return;
  await uploadService.uploadProfilePhoto(imageUri, usuarioId);
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
  const { data, error } = await supabase.schema(schema).from(table).delete().eq('id', id).select('id');
  if (error) throw new Error(getSupabaseErrorMessage(error, table, 'excluir'));
  if (!data || data.length === 0) {
    throw new Error(`Nao foi possivel excluir em connect.${table}. O registro nao foi encontrado ou seu usuario nao tem permissao.`);
  }
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

async function syncAlunoTurmaLink(alunoId: string, turmaId: string | null) {
  if (!turmaId) return;

  const deactivate = await supabase
    .schema(schema)
    .from('turma_alunos')
    .update({ ativo: false, data_saida: new Date().toISOString().slice(0, 10) })
    .eq('aluno_id', alunoId)
    .neq('turma_id', turmaId);
  if (deactivate.error) throw deactivate.error;

  const { data: existing } = await supabase
    .schema(schema)
    .from('turma_alunos')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('turma_id', turmaId)
    .maybeSingle();

  if ((existing as Row | null)?.id) {
    const update = await supabase
      .schema(schema)
      .from('turma_alunos')
      .update({ ativo: true, data_saida: null })
      .eq('id', (existing as Row).id);
    if (update.error) throw update.error;
    return;
  }

  const insert = await supabase.schema(schema).from('turma_alunos').insert({ aluno_id: alunoId, turma_id: turmaId, ativo: true });
  if (insert.error) throw insert.error;
}

async function syncProfessorTurmaLink(turmaId: string, professorId: string | null) {
  if (!professorId) return;

  const deactivate = await supabase
    .schema(schema)
    .from('professor_turmas')
    .update({ ativo: false })
    .eq('turma_id', turmaId)
    .neq('professor_id', professorId);
  if (deactivate.error) throw deactivate.error;

  const { data: existing } = await supabase
    .schema(schema)
    .from('professor_turmas')
    .select('id')
    .eq('turma_id', turmaId)
    .eq('professor_id', professorId)
    .is('disciplina', null)
    .maybeSingle();

  if ((existing as Row | null)?.id) {
    const update = await supabase.schema(schema).from('professor_turmas').update({ ativo: true }).eq('id', (existing as Row).id);
    if (update.error) throw update.error;
    return;
  }

  const insert = await supabase.schema(schema).from('professor_turmas').insert({
    turma_id: turmaId,
    professor_id: professorId,
    ativo: true,
  });
  if (insert.error) throw insert.error;
}

function isEmpresaAtiva(status?: string | null) {
  return ['ativa', 'ativo', 'active'].includes(normalizeStatus(status, 'ativa'));
}

async function getActiveEmpresa(empresaId: string) {
  const { data, error } = await supabase
    .schema(schema)
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .maybeSingle();

  if (error) throw new Error(getSupabaseErrorMessage(error, 'empresas', 'consultar'));
  if (!data) throw new Error('A empresa selecionada nao foi encontrada.');

  const empresa = mapEmpresa(data as Row);
  if (!isEmpresaAtiva(empresa.status)) {
    throw new Error('A empresa selecionada esta inativa. Escolha uma empresa ativa.');
  }
  return empresa;
}

async function createOrUpdateAutomaticContract(alunoId: string, empresa: Empresa) {
  const { data: existingData, error: existingError } = await supabase
    .schema(schema)
    .from('contratos_alunos')
    .select('id,empresa_id,status')
    .eq('aluno_id', alunoId)
    .neq('status', 'encerrado')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(getSupabaseErrorMessage(existingError, 'contratos_alunos', 'consultar'));
  }

  const companyPayload = {
    empresa_id: empresa.id,
    empresa_nome: empresa.nome,
    localizacao_empresa: empresa.endereco ?? null,
    email_empresa: empresa.email ?? null,
  };

  const fullCompanyPayload = {
    ...companyPayload,
    company_name: empresa.nome,
    company_email: empresa.email ?? null,
  };

  if ((existingData as Row | null)?.id) {
    return updateWithFallback('contratos_alunos', (existingData as Row).id, [
      fullCompanyPayload,
      companyPayload,
    ]);
  }

  const creationPayload = {
    ...companyPayload,
    data_inicio: new Date().toISOString().slice(0, 10),
    status: 'ativo',
  };
  const fullCreationPayload = {
    ...fullCompanyPayload,
    data_inicio: creationPayload.data_inicio,
    status: creationPayload.status,
  };

  return insertWithFallback('contratos_alunos', [
    { aluno_id: alunoId, ...fullCreationPayload },
    { aluno_id: alunoId, ...creationPayload },
  ]);
}

function mapAluno(row: Row): Aluno {
  const usuario = relation(row, 'usuario') ?? relation(row, 'usuarios') ?? {};
  const turma = relation(row, 'turma') ?? relation(row, 'turmas') ?? {};
  const curso = relation(row, 'curso') ?? relation(row, 'cursos') ?? {};
  const foto = relation(row, 'foto') ?? relation(row, 'arquivos') ?? {};

  return {
    id: row.id,
    usuario_id: row.usuario_id,
    foto_arquivo_id: row.foto_arquivo_id,
    foto_url: row.foto_url ?? row.url_segura ?? foto.url_segura,
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
    empresa_id: row.empresa_id,
    empresa_nome: row.empresa_nome ?? relation(row, 'empresa')?.nome,
  };
}

function mapProfessor(row: Row): Professor {
  const usuario = relation(row, 'usuario') ?? relation(row, 'usuarios') ?? {};
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    foto_arquivo_id: usuario.foto_arquivo_id,
    foto_url: usuario.foto_url,
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
    endereco: row.endereco,
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
    aluno_cpf: row.aluno_cpf ?? aluno.cpf ?? usuario.cpf,
    aluno_rm: row.aluno_rm ?? aluno.rm ?? aluno.matricula,
    empresa_id: row.empresa_id,
    empresa_nome: row.empresa_nome ?? empresa.nome,
    empresa_cnpj: row.empresa_cnpj ?? empresa.cnpj,
    empresa_endereco: row.empresa_endereco ?? empresa.endereco ?? row.localizacao_empresa,
    monthly_value: row.monthly_value == null ? null : Number(row.monthly_value),
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
    outros_descontos:
      row.outros_descontos == null
        ? row.deductions == null
          ? null
          : Number(row.deductions)
        : Number(row.outros_descontos),
    deductions: row.deductions == null ? null : Number(row.deductions),
    bonuses: row.bonuses == null ? null : Number(row.bonuses),
    salario_final: row.salario_final == null ? null : Number(row.salario_final),
    valor_dia: row.valor_dia == null ? null : Number(row.valor_dia),
    desconto: row.desconto == null ? null : Number(row.desconto),
    frequencia_percentual: row.frequencia_percentual == null ? null : Number(row.frequencia_percentual),
    dias_trabalhados: row.dias_trabalhados,
    faltas_injustificadas: row.faltas_injustificadas,
    status: row.status,
    calculado_em: row.calculado_em ?? row.calculated_at,
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
    turma_id: aula.turma_id,
    professor_id: aula.professor_id,
    disciplina: aula.disciplina,
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
  const turma = relation(aluno, 'turma') ?? {};
  const curso = relation(aluno, 'curso') ?? {};
  return {
    id: row.id ?? row.aluno_id,
    aluno_id: row.aluno_id,
    aluno_nome: row.aluno_nome ?? aluno.nome ?? usuario.nome,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    dentro_do_senai: row.dentro_do_senai ?? row.dentro_perimetro,
    dentro_perimetro: row.dentro_perimetro ?? row.dentro_do_senai,
    em_aula: row.em_aula,
    turma_id: aluno.turma_id,
    turma_nome: aluno.turma_nome ?? turma.nome,
    curso_id: aluno.curso_id,
    curso_nome: aluno.curso_nome ?? curso.nome,
    email_institucional: aluno.email_institucional ?? aluno.email ?? usuario.email_institucional,
    data_hora: row.data_hora,
    precisao_metros: row.precisao_metros == null ? null : Number(row.precisao_metros),
  };
}

export const connectService = {
  async listAlunos(): Promise<Aluno[]> {
    const rows = await hydrateAlunos(await selectRows('alunos'));
    return rows.map(mapAluno);
  },

  async createAluno(values: FormValues, enviadoPor?: string | null) {
    const empresaId = requiredUuid(values.empresa_id, 'empresa');
    const empresa = await getActiveEmpresa(empresaId);
    const cursoId = uuidOrNull(values.curso_id, 'curso');
    const turmaId = uuidOrNull(values.turma_id, 'turma');
    let usuarioId: string | null = null;
    let alunoId: string | null = null;

    try {
      usuarioId = await createHubUser(values, 'aluno');
      const aluno = await insertWithFallback('alunos', [
        {
          usuario_id: usuarioId,
          curso_id: cursoId,
          turma_id: turmaId,
          rm: nullIfEmpty(values.rm) ?? `${Date.now()}`,
          email_pessoal: nullIfEmpty(values.email_pessoal),
          email_institucional: nullIfEmpty(values.email),
          empresa_nome: empresa.nome,
          data_nascimento: nullIfEmpty(values.data_nascimento),
          nome_responsavel: nullIfEmpty(values.nome_responsavel),
          status: normalizeStatus(values.status),
        },
      ]);
      const createdAlunoId = String((aluno as Row).id ?? '');
      if (!createdAlunoId) {
        throw new Error('O banco nao retornou o ID do aluno criado.');
      }
      alunoId = createdAlunoId;

      await syncAlunoTurmaLink(createdAlunoId, turmaId);
      await createOrUpdateAutomaticContract(createdAlunoId, empresa);
      await attachAlunoPhoto(createdAlunoId, values.foto_uri, enviadoPor ?? usuarioId, usuarioId);

      return {
        ...(aluno as Row),
        empresa_id: empresa.id,
        empresa_nome: empresa.nome,
      };
    } catch (error) {
      const cleanupErrors: string[] = [];

      if (alunoId) {
        try {
          await deleteRow('alunos', alunoId);
        } catch (cleanupError) {
          cleanupErrors.push(`aluno: ${getErrorMessage(cleanupError, 'falha ao remover o aluno')}`);
        }
      }

      if (usuarioId) {
        try {
          await deleteAuthUserProfile(usuarioId);
        } catch (cleanupError) {
          cleanupErrors.push(`usuario: ${getErrorMessage(cleanupError, 'falha ao remover o usuario')}`);
        }
      }

      const originalMessage = getErrorMessage(error, 'Nao foi possivel criar o aluno e o contrato automatico.');
      if (!usuarioId && !alunoId) {
        throw new Error(originalMessage);
      }
      if (cleanupErrors.length > 0) {
        throw new Error(
          `${originalMessage} A reversao automatica ficou incompleta (${cleanupErrors.join('; ')}). Verifique o aluno, o contrato e o usuario cadastrado antes de tentar novamente.`
        );
      }
      throw new Error(`${originalMessage} O cadastro parcial foi revertido automaticamente.`);
    }
  },

  async updateAluno(id: string, values: FormValues, enviadoPor?: string | null) {
    const { data } = await supabase.schema(schema).from('alunos').select('usuario_id').eq('id', id).single();
    const usuarioId = (data as Row | null)?.usuario_id as string | null | undefined;
    const empresaId = requiredUuid(values.empresa_id, 'empresa');
    const empresa = await getActiveEmpresa(empresaId);
    const cursoId = uuidOrNull(values.curso_id, 'curso');
    const turmaId = uuidOrNull(values.turma_id, 'turma');
    await updateHubUser(usuarioId, values);
    const aluno = await updateWithFallback('alunos', id, [
      {
        curso_id: cursoId,
        turma_id: turmaId,
        rm: nullIfEmpty(values.rm),
        email_pessoal: nullIfEmpty(values.email_pessoal),
        email_institucional: nullIfEmpty(values.email),
        empresa_nome: empresa.nome,
        data_nascimento: nullIfEmpty(values.data_nascimento),
        nome_responsavel: nullIfEmpty(values.nome_responsavel),
        status: normalizeStatus(values.status),
      },
    ]);
    await syncAlunoTurmaLink(id, turmaId);
    await createOrUpdateAutomaticContract(id, empresa);
    await attachAlunoPhoto(id, values.foto_uri, enviadoPor ?? usuarioId, usuarioId);
    return {
      ...(aluno as Row),
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
    };
  },

  deleteAluno: (id: string) => deleteRow('alunos', id),

  async listProfessores(): Promise<Professor[]> {
    const rows = await hydrateProfessores(await selectRows('professores'));
    return rows.map(mapProfessor);
  },

  async createProfessor(values: FormValues) {
    const usuarioId = await createHubUser(values, 'professor');
    const professor = await insertWithFallback('professores', [
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
    await attachProfilePhoto(usuarioId, values.foto_uri);
    return professor;
  },

  async updateProfessor(id: string, values: FormValues) {
    const { data } = await supabase.schema(schema).from('professores').select('usuario_id').eq('id', id).single();
    const usuarioId = (data as Row | null)?.usuario_id as string | null | undefined;
    await updateHubUser(usuarioId, values);
    const professor = await updateWithFallback('professores', id, [
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
    await attachProfilePhoto(usuarioId, values.foto_uri);
    return professor;
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

  async createTurma(values: FormValues) {
    const professorId = uuidOrNull(values.professor_responsavel_id, 'professor');
    const turma = await insertWithFallback('turmas', [
      {
        nome: nullIfEmpty(values.nome),
        curso_id: uuidOrNull(values.curso_id, 'curso'),
        professor_responsavel_id: professorId,
        periodo: normalizeStatus(values.periodo, 'manha'),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        horario_inicio: nullIfEmpty(values.horario_inicio),
        horario_fim: nullIfEmpty(values.horario_fim),
        status: normalizeStatus(values.status, 'ativa'),
      },
    ]);
    await syncProfessorTurmaLink((turma as Row).id, professorId);
    return turma;
  },

  async updateTurma(id: string, values: FormValues) {
    const professorId = uuidOrNull(values.professor_responsavel_id, 'professor');
    const turma = await updateWithFallback('turmas', id, [
      {
        nome: nullIfEmpty(values.nome),
        curso_id: uuidOrNull(values.curso_id, 'curso'),
        professor_responsavel_id: professorId,
        periodo: normalizeStatus(values.periodo, 'manha'),
        data_inicio: nullIfEmpty(values.data_inicio),
        data_termino: nullIfEmpty(values.data_termino),
        horario_inicio: nullIfEmpty(values.horario_inicio),
        horario_fim: nullIfEmpty(values.horario_fim),
        status: normalizeStatus(values.status, 'ativa'),
      },
    ]);
    await syncProfessorTurmaLink(id, professorId);
    return turma;
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
        endereco: nullIfEmpty(values.endereco),
        responsavel_nome: nullIfEmpty(values.responsavel_nome),
        status: normalizeStatus(values.status, 'ativa'),
      },
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
        endereco: nullIfEmpty(values.endereco),
        responsavel_nome: nullIfEmpty(values.responsavel_nome),
        status: normalizeStatus(values.status, 'ativa'),
      },
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
        monthly_value: numberOrZero(values.monthly_value),
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
        monthly_value: numberOrZero(values.monthly_value),
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

  async listSalarios(mesReferencia?: string): Promise<SalarioAluno[]> {
    let query = supabase
      .schema(schema)
      .from('salarios_alunos')
      .select('*')
      .order('mes_referencia', { ascending: false });
    if (mesReferencia) {
      query = query.eq('mes_referencia', normalizeReferenceMonth(mesReferencia));
    }
    const { data, error } = await query;
    if (error) throw new Error(getSupabaseErrorMessage(error, 'salarios_alunos', 'consultar'));
    const rows = await hydrateContratos((data ?? []) as Row[]);
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
    const rows = await hydrateLocalizacoes(await selectRows('localizacoes_alunos'));
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

  async listActiveEmpresaOptions() {
    const empresas = await connectService.listEmpresas();
    return empresas
      .filter((empresa) => isEmpresaAtiva(empresa.status))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      .map((empresa) => ({
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

  async getAlunoByUserId(userId: string): Promise<Aluno | null> {
    const { data, error } = await supabase.schema(schema).from('alunos').select('*').eq('usuario_id', userId).maybeSingle();
    if (error || !data) return null;
    const rows = await hydrateAlunos([data as Row]);
    return mapAluno(rows[0]);
  },

  async getProfessorByUserId(userId: string): Promise<Professor | null> {
    const { data, error } = await supabase
      .schema(schema)
      .from('professores')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const rows = await hydrateProfessores([data as Row]);
    return mapProfessor(rows[0]);
  },

  async listTurmasForProfessorUser(userId: string): Promise<Turma[]> {
    const professor = await connectService.getProfessorByUserId(userId);
    if (!professor) return [];

    const { data } = await supabase
      .schema(schema)
      .from('professor_turmas')
      .select('turma_id')
      .eq('professor_id', professor.id);
    const turmaIds = uniqueIds(((data ?? []) as Row[]).map((row) => row.turma_id));

    if (turmaIds.length > 0) {
      const rows = await hydrateTurmas(await selectRowsByIds('turmas', turmaIds, '*'));
      return rows.map(mapTurma);
    }

    const { data: fallback } = await supabase
      .schema(schema)
      .from('turmas')
      .select('*')
      .eq('professor_responsavel_id', professor.id);
    const rows = await hydrateTurmas((fallback ?? []) as Row[]);
    return rows.map(mapTurma);
  },

  async listAlunosByTurma(turmaId: string): Promise<Aluno[]> {
    const { data, error } = await supabase.schema(schema).from('alunos').select('*').eq('turma_id', turmaId);
    if (error) throw error;
    return (await hydrateAlunos((data ?? []) as Row[]))
      .map(mapAluno)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  },

  async getChamada(turmaId: string, dataAula: string) {
    const { data: aula, error: aulaError } = await supabase
      .schema(schema)
      .from('aulas')
      .select('*')
      .eq('turma_id', requiredUuid(turmaId, 'turma'))
      .eq('data_aula', dataAula)
      .eq('disciplina', 'Chamada')
      .maybeSingle();

    if (aulaError) {
      throw new Error(getSupabaseErrorMessage(aulaError, 'aulas', 'consultar'));
    }
    if (!aula) return null;

    const { data: frequencias, error: frequenciasError } = await supabase
      .schema(schema)
      .from('frequencias')
      .select('*')
      .eq('aula_id', (aula as Row).id);

    if (frequenciasError) {
      throw new Error(getSupabaseErrorMessage(frequenciasError, 'frequencias', 'consultar'));
    }

    return {
      id: String((aula as Row).id),
      quantidadeAulas: Math.min(
        5,
        Math.max(1, Number((aula as Row).quantidade_aulas ?? (aula as Row).lessons_count ?? 4))
      ),
      registros: ((frequencias ?? []) as Row[]).map((frequencia) => ({
        alunoId: String(frequencia.aluno_id),
        status: normalizeAttendanceStatus(frequencia.status),
        missedLessons: Math.max(
          0,
          Number(frequencia.quantidade_aulas_faltadas ?? frequencia.missed_lessons ?? 0)
        ),
      })),
    };
  },

  async saveChamada(input: {
    turmaId: string;
    professorId?: string | null;
    dataAula: string;
    quantidadeAulas: number;
    registradoPor?: string | null;
    registros: {
      alunoId: string;
      status: 'presente' | 'falta_justificada' | 'falta_injustificada';
      missedLessons: number;
    }[];
  }) {
    const quantidadeAulas = Math.min(5, Math.max(1, Math.trunc(input.quantidadeAulas)));
    const { data: existing, error: existingError } = await supabase
      .schema(schema)
      .from('aulas')
      .select('*')
      .eq('turma_id', input.turmaId)
      .eq('data_aula', input.dataAula)
      .eq('disciplina', 'Chamada')
      .maybeSingle();

    if (existingError) {
      throw new Error(getSupabaseErrorMessage(existingError, 'aulas', 'consultar'));
    }

    const aulaPayload = {
      professor_id: uuidOrNull(input.professorId, 'professor'),
      quantidade_aulas: quantidadeAulas,
      lessons_count: quantidadeAulas,
    };
    let aula: Row;
    let created = false;

    if (existing) {
      aula = (await updateWithFallback('aulas', (existing as Row).id, [
        aulaPayload,
        {
          professor_id: aulaPayload.professor_id,
          quantidade_aulas: aulaPayload.quantidade_aulas,
        },
      ])) as Row;
    } else {
      aula = (await insertWithFallback('aulas', [
        {
          turma_id: requiredUuid(input.turmaId, 'turma'),
          disciplina: 'Chamada',
          data_aula: input.dataAula,
          criado_por: uuidOrNull(input.registradoPor, 'usuario'),
          ...aulaPayload,
        },
        {
          turma_id: requiredUuid(input.turmaId, 'turma'),
          professor_id: aulaPayload.professor_id,
          disciplina: 'Chamada',
          data_aula: input.dataAula,
          quantidade_aulas: aulaPayload.quantidade_aulas,
        },
      ])) as Row;
      created = true;
    }

    const fullRows = input.registros.map((registro) => {
      const missedLessons =
        registro.status === 'presente'
          ? 0
          : Math.min(quantidadeAulas, Math.max(1, Math.trunc(registro.missedLessons)));
      return {
        aula_id: aula.id,
        aluno_id: requiredUuid(registro.alunoId, 'aluno'),
        status: registro.status,
        quantidade_aulas_faltadas: missedLessons,
        missed_lessons: missedLessons,
        registrado_por: uuidOrNull(input.registradoPor, 'usuario'),
      };
    });

    const legacyRows = fullRows.map(({ missed_lessons: _missedLessons, ...row }) => row);
    let saveError: unknown = null;

    for (const rows of [fullRows, legacyRows]) {
      const { error } = await supabase
        .schema(schema)
        .from('frequencias')
        .upsert(rows as never, { onConflict: 'aula_id,aluno_id' });
      if (!error) {
        saveError = null;
        break;
      }
      saveError = error;
    }

    if (saveError) {
      if (created) {
        await supabase.schema(schema).from('aulas').delete().eq('id', aula.id);
      }
      throw new Error(getSupabaseErrorMessage(saveError, 'frequencias'));
    }

    return { id: String(aula.id), created };
  },

  async listFrequenciasByAluno(alunoId: string, mesReferencia?: string): Promise<FrequenciaRegistro[]> {
    let query = supabase.schema(schema).from('frequencias').select('*').eq('aluno_id', alunoId);
    const { data, error } = await query;
    if (error) throw error;
    const rows = await hydrateFrequencias((data ?? []) as Row[]);
    const mapped = rows.map(mapFrequencia);
    if (!mesReferencia) return mapped;
    return mapped.filter((item) => (item.data_aula ?? item.data ?? '').startsWith(mesReferencia));
  },

  async listContratosByAluno(alunoId: string): Promise<ContratoAluno[]> {
    const { data, error } = await supabase.schema(schema).from('contratos_alunos').select('*').eq('aluno_id', alunoId);
    if (error) throw error;
    return (await hydrateContratos((data ?? []) as Row[])).map(mapContrato);
  },

  async previewSalary(input: {
    alunoId: string;
    mesReferencia: string;
    bonuses?: number | null;
    deductions?: number | null;
  }): Promise<SalaryPreviewData> {
    const alunoId = requiredUuid(input.alunoId, 'aluno');
    const mesReferencia = normalizeReferenceMonth(input.mesReferencia);
    const [year, month] = mesReferencia.split('-').map(Number);
    const monthStart = `${mesReferencia}-01`;
    const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

    const { data: alunoData, error: alunoError } = await supabase
      .schema(schema)
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .maybeSingle();
    if (alunoError) throw new Error(getSupabaseErrorMessage(alunoError, 'alunos', 'consultar'));
    if (!alunoData) throw new Error('O aluno selecionado nao foi encontrado.');

    const [alunoRow] = await hydrateAlunos([alunoData as Row]);
    const aluno = mapAluno(alunoRow);
    const [contratos, frequencias] = await Promise.all([
      connectService.listContratosByAluno(alunoId),
      connectService.listFrequenciasByAluno(alunoId, mesReferencia),
    ]);

    const contrato =
      contratos
        .filter((item) => {
          const status = normalizeStatus(item.status);
          const startDate = item.data_inicio?.slice(0, 10);
          const endDate = (item.data_fim ?? item.data_termino)?.slice(0, 10);
          return (
            ['ativo', 'active'].includes(status) &&
            (!startDate || startDate <= monthEnd) &&
            (!endDate || endDate >= monthStart)
          );
        })
        .sort((a, b) => (b.data_inicio ?? '').localeCompare(a.data_inicio ?? ''))[0] ?? null;

    const totalDays = frequencias.length;
    const presentDays = frequencias.filter(
      (item) => normalizeAttendanceStatus(item.status) === 'presente'
    ).length;
    const justifiedAbsences = frequencias.filter(
      (item) => normalizeAttendanceStatus(item.status) === 'falta_justificada'
    ).length;
    const unjustifiedAbsences = frequencias.filter(
      (item) => normalizeAttendanceStatus(item.status) === 'falta_injustificada'
    ).length;
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;

    const contractAmount = Number(contrato?.monthly_value ?? 0);
    const baseAmount = contractAmount > 0 ? contractAmount : 1518;
    const workDays = 22;
    const dailyRate = roundMoney(baseAmount / workDays);
    const absenceDeduction = roundMoney(dailyRate * unjustifiedAbsences);
    const bonuses = roundMoney(Math.max(0, Number(input.bonuses ?? 0)));
    const deductions =
      input.deductions == null
        ? absenceDeduction
        : roundMoney(Math.max(0, Number(input.deductions)));
    const otherDeductions = roundMoney(Math.max(deductions - absenceDeduction, 0));
    const netAmount = roundMoney(Math.max(baseAmount + bonuses - deductions, 0));

    return {
      student: {
        id: aluno.id,
        full_name: aluno.nome,
        registration_number: aluno.rm,
        class_name: aluno.turma_nome,
        course_name: aluno.curso_nome,
      },
      reference_month: mesReferencia,
      attendance: {
        total_days: totalDays,
        present_days: presentDays,
        justified_absences: justifiedAbsences,
        unjustified_absences: unjustifiedAbsences,
        rate,
      },
      daily_rate: dailyRate,
      contract: contrato
        ? {
            id: contrato.id,
            company_id: contrato.empresa_id,
            company_name: contrato.empresa_nome ?? 'Empresa nao informada',
            monthly_value: baseAmount,
            status: contrato.status ?? 'ativo',
          }
        : null,
      amounts: {
        base: baseAmount,
        bonuses,
        deductions,
        net: netAmount,
        absence_deduction: absenceDeduction,
        other_deductions: otherDeductions,
      },
      breakdown: [
        { label: 'Salario base do contrato', value: baseAmount, type: 'base' },
        { label: 'Bonificacoes', value: bonuses, type: 'bonus' },
        {
          label: 'Desconto por faltas injustificadas',
          value: -absenceDeduction,
          type: 'deduction',
        },
        { label: 'Outros descontos', value: -otherDeductions, type: 'deduction' },
        { label: 'Valor liquido', value: netAmount, type: 'net' },
      ],
      work_days: workDays,
    };
  },

  async calculateSalary(input: {
    alunoId: string;
    mesReferencia: string;
    bonuses?: number | null;
    deductions?: number | null;
  }) {
    const preview = await connectService.previewSalary(input);
    const calculatedAt = new Date().toISOString();
    const carga = (
      await connectService.listContratosByAluno(preview.student.id)
    ).find((item) => item.id === preview.contract?.id)?.carga_horaria;
    const cargaDiariaHoras = carga?.includes('4') ? 4 : 6;
    const diasTrabalhados = Math.max(
      0,
      preview.work_days - preview.attendance.unjustified_absences
    );

    const fullPayload = {
      aluno_id: preview.student.id,
      empresa_id: preview.contract?.company_id ?? null,
      contrato_id: preview.contract?.id ?? null,
      mes_referencia: preview.reference_month,
      reference_month: `${preview.reference_month}-01`,
      tipo_pagamento: 'mensal',
      salario_base: preview.amounts.base,
      base_amount: preview.amounts.base,
      valor_hora: roundMoney(
        preview.amounts.base / (preview.work_days * cargaDiariaHoras)
      ),
      valor_dia: preview.daily_rate,
      carga_diaria_horas: cargaDiariaHoras,
      dias_uteis_mes: preview.work_days,
      outros_descontos: preview.amounts.deductions,
      deductions: preview.amounts.deductions,
      bonuses: preview.amounts.bonuses,
      desconto: preview.amounts.deductions,
      salario_final: preview.amounts.net,
      net_amount: preview.amounts.net,
      frequencia_percentual: preview.attendance.rate,
      dias_trabalhados: diasTrabalhados,
      faltas_injustificadas: preview.attendance.unjustified_absences,
      status: 'calculado',
      calculado_em: calculatedAt,
      calculated_at: calculatedAt,
    };
    const legacyPayload = {
      aluno_id: fullPayload.aluno_id,
      empresa_id: fullPayload.empresa_id,
      contrato_id: fullPayload.contrato_id,
      mes_referencia: fullPayload.mes_referencia,
      tipo_pagamento: fullPayload.tipo_pagamento,
      salario_base: fullPayload.salario_base,
      valor_hora: fullPayload.valor_hora,
      valor_dia: fullPayload.valor_dia,
      carga_diaria_horas: fullPayload.carga_diaria_horas,
      dias_uteis_mes: fullPayload.dias_uteis_mes,
      outros_descontos: fullPayload.outros_descontos,
      desconto: fullPayload.desconto,
      salario_final: fullPayload.salario_final,
      frequencia_percentual: fullPayload.frequencia_percentual,
      dias_trabalhados: fullPayload.dias_trabalhados,
      faltas_injustificadas: fullPayload.faltas_injustificadas,
      status: fullPayload.status,
      calculado_em: fullPayload.calculado_em,
    };

    const { data: existing, error: existingError } = await supabase
      .schema(schema)
      .from('salarios_alunos')
      .select('id')
      .eq('aluno_id', preview.student.id)
      .eq('mes_referencia', preview.reference_month)
      .maybeSingle();
    if (existingError) {
      throw new Error(getSupabaseErrorMessage(existingError, 'salarios_alunos', 'consultar'));
    }

    const saved = existing
      ? await updateWithFallback('salarios_alunos', (existing as Row).id, [
          fullPayload,
          legacyPayload,
        ])
      : await insertWithFallback('salarios_alunos', [fullPayload, legacyPayload]);

    return {
      record: mapSalario({
        ...(saved as Row),
        aluno_nome: preview.student.full_name,
        empresa_nome: preview.contract?.company_name,
      }),
      preview,
      updated: Boolean(existing),
    };
  },

  async calculateSalaryBatch(mesReferencia: string) {
    const month = normalizeReferenceMonth(mesReferencia);
    const alunos = (await connectService.listAlunos()).filter(
      (aluno) => normalizeStatus(aluno.status) === 'ativo'
    );
    const errors: { alunoId: string; alunoNome: string; message: string }[] = [];
    let processed = 0;

    for (const aluno of alunos) {
      try {
        await connectService.calculateSalary({
          alunoId: aluno.id,
          mesReferencia: month,
        });
        processed += 1;
      } catch (error) {
        errors.push({
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          message: getErrorMessage(error, 'Falha no calculo salarial.'),
        });
      }
    }

    return { processed, errors };
  },

  async calculateSalaryForAluno(
    alunoId: string,
    mesReferencia = new Date().toISOString().slice(0, 7)
  ) {
    const preview = await connectService.previewSalary({
      alunoId,
      mesReferencia,
    });
    const cargaDiariaHoras = 6;
    return mapSalario({
      id: `${alunoId}-${preview.reference_month}`,
      aluno_id: alunoId,
      aluno_nome: preview.student.full_name,
      contrato_id: preview.contract?.id ?? null,
      empresa_id: preview.contract?.company_id ?? null,
      empresa_nome: preview.contract?.company_name,
      tipo_pagamento: 'mensal',
      mes_referencia: preview.reference_month,
      mes: preview.reference_month,
      salario_base: preview.amounts.base,
      bonuses: preview.amounts.bonuses,
      deductions: preview.amounts.deductions,
      valor_hora:
        preview.amounts.base / (preview.work_days * cargaDiariaHoras),
      carga_diaria_horas: cargaDiariaHoras,
      dias_uteis_mes: preview.work_days,
      valor_dia: preview.daily_rate,
      desconto: preview.amounts.deductions,
      salario_final: preview.amounts.net,
      frequencia_percentual: preview.attendance.rate,
      dias_trabalhados: Math.max(
        0,
        preview.work_days - preview.attendance.unjustified_absences
      ),
      faltas_injustificadas: preview.attendance.unjustified_absences,
      status: 'calculado',
    });
  },

  async getDashboardMetrics() {
    const [alunos, professores, turmas, cursos] = await Promise.all([
      countRows('alunos'),
      countRows('professores'),
      countRows('turmas'),
      countRows('cursos'),
    ]);

    return {
      totalAlunos: alunos,
      totalProfessores: professores,
      totalTurmas: turmas,
      totalCursos: cursos,
    };
  },
};
