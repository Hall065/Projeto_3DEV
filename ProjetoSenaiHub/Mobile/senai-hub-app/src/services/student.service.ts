import { connectService } from '@/services/connect.service';
import type { Aluno, ContratoAluno, FrequenciaRegistro, LocalizacaoAluno, SalarioAluno } from '@/types/connect.types';

export interface StudentDashboardData {
  aluno: Aluno | null;
  frequencias: FrequenciaRegistro[];
  salario: SalarioAluno | null;
  contratos: ContratoAluno[];
  localizacao: LocalizacaoAluno | null;
}

export const studentService = {
  async getDashboard(userId: string, mesReferencia = new Date().toISOString().slice(0, 7)): Promise<StudentDashboardData> {
    const aluno = await connectService.getAlunoByUserId(userId);
    if (!aluno) {
      return { aluno: null, frequencias: [], salario: null, contratos: [], localizacao: null };
    }

    const [frequencias, salario, contratos, localizacoes] = await Promise.all([
      connectService.listFrequenciasByAluno(aluno.id, mesReferencia),
      connectService.calculateSalaryForAluno(aluno.id, mesReferencia),
      connectService.listContratosByAluno(aluno.id),
      connectService.listLocalizacoes(),
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
