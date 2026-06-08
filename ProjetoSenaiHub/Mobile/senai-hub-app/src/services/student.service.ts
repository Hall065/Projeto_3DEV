import { connectService } from '@/services/connect.service';
import type { Aluno, ContratoAluno, FrequenciaRegistro, LocalizacaoAluno, SalarioAluno } from '@/types/connect.types';

export interface StudentDashboardData {
  aluno: Aluno | null;
  frequencias: FrequenciaRegistro[];
  salario: SalarioAluno | null;
  contratos: ContratoAluno[];
  localizacao: LocalizacaoAluno | null;
}

async function safeResult<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export const studentService = {
  async getDashboard(userId: string, mesReferencia = new Date().toISOString().slice(0, 7)): Promise<StudentDashboardData> {
    const aluno = await connectService.getAlunoByUserId(userId);
    if (!aluno) {
      return { aluno: null, frequencias: [], salario: null, contratos: [], localizacao: null };
    }

    const [frequencias, salario, contratos, localizacoes] = await Promise.all([
      safeResult(connectService.listFrequenciasByAluno(aluno.id, mesReferencia), []),
      safeResult(connectService.calculateSalaryForAluno(aluno.id, mesReferencia), null),
      safeResult(connectService.listContratosByAluno(aluno.id), []),
      safeResult(connectService.listLocalizacoes(), []),
    ]);

    return {
      aluno,
      frequencias,
      salario,
      contratos,
      localizacao: localizacoes.find((item) => item.aluno_id === aluno.id) ?? null,
    };
  },
};
