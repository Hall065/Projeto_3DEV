<?php

namespace App\Support\Spreadsheet;

class SpreadsheetRegistry
{
    /**
     * @return array<string, array<string, array<string, mixed>>>
     */
    public static function modules(): array
    {
        return [
            'connect' => self::connect(),
            'grid' => self::grid(),
        ];
    }

    /**
     * @return array<string, array<string, mixed>>|null
     */
    public static function find(string $module, string $key): ?array
    {
        return self::modules()[$module][$key] ?? null;
    }

    /**
     * @return list<array{key: string, header: string, required?: bool, example?: string}>
     */
    public static function columns(string $module, string $key): array
    {
        $definition = self::find($module, $key);

        return $definition['columns'] ?? [];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function connect(): array
    {
        return [
            'people' => self::def(
                'Pessoas (cadastro global)',
                'Cadastro unificado de pessoas no HUB. Use antes de vincular alunos ou professores.',
                [
                    ['key' => 'tipo', 'header' => 'tipo', 'required' => true, 'example' => 'student'],
                    ['key' => 'nome_completo', 'header' => 'nome_completo', 'required' => true, 'example' => 'Ana Silva'],
                    ['key' => 'cpf', 'header' => 'cpf', 'example' => '123.456.789-00'],
                    ['key' => 'email', 'header' => 'email', 'example' => 'ana@aluno.senai.local'],
                    ['key' => 'telefone', 'header' => 'telefone', 'example' => '(11) 99999-0000'],
                    ['key' => 'matricula', 'header' => 'matricula', 'example' => '2025INF0001'],
                    ['key' => 'data_nascimento', 'header' => 'data_nascimento', 'example' => '2006-05-12'],
                    ['key' => 'especialidade', 'header' => 'especialidade', 'example' => ''],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                ],
            ),
            'students' => self::def(
                'Alunos',
                'Matricula e codigo_turma identificam o registro. Linhas existentes sao atualizadas.',
                [
                    ['key' => 'matricula', 'header' => 'matricula', 'required' => true, 'example' => '2025INF0001'],
                    ['key' => 'nome_completo', 'header' => 'nome_completo', 'required' => true, 'example' => 'Ana Silva'],
                    ['key' => 'cpf', 'header' => 'cpf', 'example' => '123.456.789-00'],
                    ['key' => 'email', 'header' => 'email', 'example' => 'ana@aluno.senai.local'],
                    ['key' => 'telefone', 'header' => 'telefone', 'example' => '(11) 99999-0000'],
                    ['key' => 'data_nascimento', 'header' => 'data_nascimento', 'example' => '2006-05-12'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                    ['key' => 'codigo_turma', 'header' => 'codigo_turma', 'example' => 'AUT-2025-2'],
                ],
            ),
            'teachers' => self::def(
                'Professores',
                'CPF ou e-mail podem identificar registros existentes.',
                [
                    ['key' => 'nome_completo', 'header' => 'nome_completo', 'required' => true, 'example' => 'Carlos Mendes'],
                    ['key' => 'cpf', 'header' => 'cpf', 'example' => '987.654.321-00'],
                    ['key' => 'email', 'header' => 'email', 'required' => true, 'example' => 'carlos@senai.local'],
                    ['key' => 'telefone', 'header' => 'telefone', 'example' => '(11) 98888-1111'],
                    ['key' => 'especialidade', 'header' => 'especialidade', 'example' => 'Automacao'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                ],
            ),
            'courses' => self::def(
                'Cursos',
                'Codigo do curso e chave unica.',
                [
                    ['key' => 'codigo', 'header' => 'codigo', 'required' => true, 'example' => 'AUT-IND'],
                    ['key' => 'nome', 'header' => 'nome', 'required' => true, 'example' => 'Automacao Industrial'],
                    ['key' => 'descricao', 'header' => 'descricao', 'example' => 'Curso tecnico'],
                    ['key' => 'carga_horaria', 'header' => 'carga_horaria', 'example' => '1200'],
                    ['key' => 'area', 'header' => 'area', 'example' => 'Industrial'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                ],
            ),
            'classes' => self::def(
                'Turmas',
                'codigo_curso e email_professor vinculam curso e docente.',
                [
                    ['key' => 'codigo', 'header' => 'codigo', 'required' => true, 'example' => 'AUT-2025-2'],
                    ['key' => 'nome', 'header' => 'nome', 'required' => true, 'example' => 'Turma Automacao 2025'],
                    ['key' => 'codigo_curso', 'header' => 'codigo_curso', 'example' => 'AUT-IND'],
                    ['key' => 'email_professor', 'header' => 'email_professor', 'example' => 'carlos@senai.local'],
                    ['key' => 'turno', 'header' => 'turno', 'example' => 'manha'],
                    ['key' => 'data_inicio', 'header' => 'data_inicio', 'example' => '2025-02-01'],
                    ['key' => 'data_fim', 'header' => 'data_fim', 'example' => '2025-12-15'],
                    ['key' => 'capacidade', 'header' => 'capacidade', 'example' => '30'],
                    ['key' => 'aulas_por_dia', 'header' => 'aulas_por_dia', 'example' => '4'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                ],
            ),
            'contracts' => self::def(
                'Contratos de alunos',
                'matricula_aluno vincula o contrato ao aluno.',
                [
                    ['key' => 'matricula_aluno', 'header' => 'matricula_aluno', 'required' => true, 'example' => '2025INF0001'],
                    ['key' => 'tipo_contrato', 'header' => 'tipo_contrato', 'required' => true, 'example' => 'estagio'],
                    ['key' => 'data_inicio', 'header' => 'data_inicio', 'required' => true, 'example' => '2025-01-01'],
                    ['key' => 'data_fim', 'header' => 'data_fim', 'example' => '2025-12-31'],
                    ['key' => 'valor_mensal', 'header' => 'valor_mensal', 'example' => '1200'],
                    ['key' => 'empresa', 'header' => 'empresa', 'example' => 'Industria ABC'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                ],
            ),
            'attendance' => self::def(
                'Frequencia (marcacoes)',
                'Exporta ou importa marcacoes por turma, data e matricula. situacao: present, justified, absent.',
                [
                    ['key' => 'codigo_turma', 'header' => 'codigo_turma', 'required' => true, 'example' => 'AUT-2025-2'],
                    ['key' => 'data_sessao', 'header' => 'data_sessao', 'required' => true, 'example' => '2025-06-01'],
                    ['key' => 'disciplina', 'header' => 'disciplina', 'example' => 'Aula regular'],
                    ['key' => 'matricula_aluno', 'header' => 'matricula_aluno', 'required' => true, 'example' => '2025INF0001'],
                    ['key' => 'situacao', 'header' => 'situacao', 'example' => 'present'],
                    ['key' => 'aulas_faltadas', 'header' => 'aulas_faltadas', 'example' => '0'],
                ],
                exportOnly: false,
            ),
            'attendance_sessions' => self::def(
                'Sessoes de frequencia',
                'Somente exportacao do historico de chamadas por turma.',
                [
                    ['key' => 'codigo_turma', 'header' => 'codigo_turma'],
                    ['key' => 'turma', 'header' => 'turma'],
                    ['key' => 'data_sessao', 'header' => 'data_sessao'],
                    ['key' => 'disciplina', 'header' => 'disciplina'],
                    ['key' => 'aulas_no_dia', 'header' => 'aulas_no_dia'],
                    ['key' => 'status_sessao', 'header' => 'status_sessao'],
                    ['key' => 'total_alunos', 'header' => 'total_alunos'],
                    ['key' => 'presentes', 'header' => 'presentes'],
                    ['key' => 'faltas', 'header' => 'faltas'],
                ],
                importable: false,
            ),
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function grid(): array
    {
        return [
            'users' => self::def(
                'Usuarios Grid',
                'Equipe de manutencao e operacao do Grid.',
                [
                    ['key' => 'nome', 'header' => 'nome', 'required' => true, 'example' => 'Joao Tecnico'],
                    ['key' => 'email', 'header' => 'email', 'required' => true, 'example' => 'joao@grid.senai.local'],
                    ['key' => 'telefone', 'header' => 'telefone', 'example' => '(11) 97777-2222'],
                    ['key' => 'perfil', 'header' => 'perfil', 'required' => true, 'example' => 'tecnico'],
                    ['key' => 'cpf', 'header' => 'cpf', 'example' => '111.222.333-44'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'active'],
                ],
            ),
            'inventory' => self::def(
                'Estoque',
                'titulo identifica o item na importacao (cria ou atualiza).',
                [
                    ['key' => 'titulo', 'header' => 'titulo', 'required' => true, 'example' => 'Parafuso M6'],
                    ['key' => 'categoria', 'header' => 'categoria', 'example' => 'Ferragens'],
                    ['key' => 'qtd_disponivel', 'header' => 'qtd_disponivel', 'example' => '100'],
                    ['key' => 'qtd_minima', 'header' => 'qtd_minima', 'example' => '10'],
                    ['key' => 'local', 'header' => 'local', 'example' => 'Almoxarifado A'],
                    ['key' => 'fornecedor', 'header' => 'fornecedor', 'example' => 'Fornecedor XYZ'],
                    ['key' => 'custo', 'header' => 'custo', 'example' => '2.50'],
                    ['key' => 'status', 'header' => 'status', 'example' => 'disponivel'],
                ],
            ),
            'tickets' => self::def(
                'Chamados',
                'Novos chamados entram com status aberto.',
                [
                    ['key' => 'titulo', 'header' => 'titulo', 'required' => true, 'example' => 'Tomada com defeito'],
                    ['key' => 'solicitante', 'header' => 'solicitante', 'required' => true, 'example' => 'Coordenacao'],
                    ['key' => 'resumo', 'header' => 'resumo', 'example' => 'Sala 12 sem energia'],
                    ['key' => 'sala', 'header' => 'sala', 'example' => '12'],
                    ['key' => 'bloco', 'header' => 'bloco', 'example' => 'B'],
                    ['key' => 'prioridade', 'header' => 'prioridade', 'example' => 'media'],
                ],
                exportColumns: [
                    ['key' => 'codigo', 'header' => 'codigo'],
                    ['key' => 'titulo', 'header' => 'titulo'],
                    ['key' => 'solicitante', 'header' => 'solicitante'],
                    ['key' => 'resumo', 'header' => 'resumo'],
                    ['key' => 'sala', 'header' => 'sala'],
                    ['key' => 'bloco', 'header' => 'bloco'],
                    ['key' => 'prioridade', 'header' => 'prioridade'],
                    ['key' => 'status', 'header' => 'status'],
                    ['key' => 'responsavel', 'header' => 'responsavel'],
                    ['key' => 'aberto_em', 'header' => 'aberto_em'],
                ],
            ),
            'tasks' => self::def(
                'Tarefas',
                'codigo_chamado vincula a tarefa a um chamado existente.',
                [
                    ['key' => 'codigo_chamado', 'header' => 'codigo_chamado', 'example' => 'GRID-2025-0001'],
                    ['key' => 'titulo', 'header' => 'titulo', 'required' => true, 'example' => 'Trocar tomada'],
                    ['key' => 'responsavel', 'header' => 'responsavel', 'example' => 'Joao Tecnico'],
                    ['key' => 'coluna', 'header' => 'coluna', 'example' => 'a_fazer'],
                    ['key' => 'prioridade', 'header' => 'prioridade', 'example' => 'media'],
                    ['key' => 'sala', 'header' => 'sala', 'example' => '12'],
                    ['key' => 'bloco', 'header' => 'bloco', 'example' => 'B'],
                ],
                exportColumns: [
                    ['key' => 'codigo', 'header' => 'codigo'],
                    ['key' => 'codigo_chamado', 'header' => 'codigo_chamado'],
                    ['key' => 'titulo', 'header' => 'titulo'],
                    ['key' => 'responsavel', 'header' => 'responsavel'],
                    ['key' => 'coluna', 'header' => 'coluna'],
                    ['key' => 'prioridade', 'header' => 'prioridade'],
                    ['key' => 'status', 'header' => 'status'],
                    ['key' => 'sala', 'header' => 'sala'],
                    ['key' => 'bloco', 'header' => 'bloco'],
                    ['key' => 'aberto_em', 'header' => 'aberto_em'],
                ],
            ),
        ];
    }

    /**
     * @param  list<array{key: string, header: string, required?: bool, example?: string}>  $columns
     * @param  list<array{key: string, header: string}>|null  $exportColumns
     * @return array<string, mixed>
     */
    private static function def(
        string $label,
        string $description,
        array $columns,
        bool $importable = true,
        bool $exportOnly = false,
        ?array $exportColumns = null,
    ): array {
        return [
            'label' => $label,
            'description' => $description,
            'columns' => $columns,
            'export_columns' => $exportColumns ?? $columns,
            'importable' => $importable && ! $exportOnly,
            'exportable' => true,
        ];
    }
}
