<?php

namespace App\Support\Reports;

class ReportSchemaRegistry
{
    /**
     * @return array<string, mixed>
     */
    public static function schema(string $module): array
    {
        return match ($module) {
            'connect' => self::connectSchema(),
            'grid' => self::gridSchema(),
            default => [],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private static function connectSchema(): array
    {
        return [
            'module' => 'connect',
            'module_label' => 'SENAI Connect',
            'default_title' => 'Relatorio Academico',
            'filters' => [
                ['key' => 'connect_course_id', 'label' => 'Curso', 'type' => 'course'],
                ['key' => 'connect_class_id', 'label' => 'Turma', 'type' => 'class'],
                ['key' => 'student_status', 'label' => 'Status do aluno', 'type' => 'select', 'options' => [
                    ['value' => '', 'label' => 'Todos'],
                    ['value' => 'active', 'label' => 'Ativo'],
                    ['value' => 'inactive', 'label' => 'Inativo'],
                    ['value' => 'graduated', 'label' => 'Formado'],
                ]],
            ],
            'sections' => [
                self::section('cover', 'Capa', 'Titulo, periodo e filtros aplicados', 'layout', true, false),
                self::section('executive_summary', 'Resumo executivo', 'Sintese em texto dos principais numeros', 'summary', true, false),
                self::section('kpi_cards', 'Indicadores (KPIs)', 'Cartoes com totais e taxas', 'kpis', true, false),
                self::section('attendance_breakdown_chart', 'Grafico — Frequencia', 'Distribuicao presente / falta justificada / injustificada', 'chart', true, false),
                self::section('students_by_course_chart', 'Grafico — Alunos por curso', 'Volume de alunos por curso', 'chart', true, false),
                self::section('students_table', 'Tabela — Alunos', 'Lista detalhada de alunos', 'table', true, true, [
                    ['key' => 'matricula', 'label' => 'Matricula', 'default' => true],
                    ['key' => 'nome', 'label' => 'Nome', 'default' => true],
                    ['key' => 'cpf', 'label' => 'CPF', 'default' => false],
                    ['key' => 'email', 'label' => 'E-mail', 'default' => true],
                    ['key' => 'telefone', 'label' => 'Telefone', 'default' => false],
                    ['key' => 'turma', 'label' => 'Turma', 'default' => true],
                    ['key' => 'curso', 'label' => 'Curso', 'default' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                    ['key' => 'data_nascimento', 'label' => 'Nascimento', 'default' => false],
                ]),
                self::section('teachers_table', 'Tabela — Professores', 'Corpo docente', 'table', true, true, [
                    ['key' => 'nome', 'label' => 'Nome', 'default' => true],
                    ['key' => 'email', 'label' => 'E-mail', 'default' => true],
                    ['key' => 'especialidade', 'label' => 'Especialidade', 'default' => true],
                    ['key' => 'telefone', 'label' => 'Telefone', 'default' => false],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                ]),
                self::section('classes_table', 'Tabela — Turmas', 'Turmas e ocupacao', 'table', true, true, [
                    ['key' => 'codigo', 'label' => 'Codigo', 'default' => true],
                    ['key' => 'nome', 'label' => 'Nome', 'default' => true],
                    ['key' => 'curso', 'label' => 'Curso', 'default' => true],
                    ['key' => 'professor', 'label' => 'Professor', 'default' => true],
                    ['key' => 'turno', 'label' => 'Turno', 'default' => true],
                    ['key' => 'alunos', 'label' => 'Qtd. alunos', 'default' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                ]),
                self::section('contracts_table', 'Tabela — Contratos', 'Contratos de alunos', 'table', true, true, [
                    ['key' => 'matricula', 'label' => 'Matricula', 'default' => true],
                    ['key' => 'aluno', 'label' => 'Aluno', 'default' => true],
                    ['key' => 'tipo', 'label' => 'Tipo', 'default' => true],
                    ['key' => 'empresa', 'label' => 'Empresa', 'default' => true],
                    ['key' => 'valor_mensal', 'label' => 'Valor mensal', 'default' => true],
                    ['key' => 'inicio', 'label' => 'Inicio', 'default' => true],
                    ['key' => 'fim', 'label' => 'Fim', 'default' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                ]),
                self::section('attendance_sessions_table', 'Tabela — Sessoes de frequencia', 'Chamadas por dia e turma', 'table', true, true, [
                    ['key' => 'data', 'label' => 'Data', 'default' => true],
                    ['key' => 'turma', 'label' => 'Turma', 'default' => true],
                    ['key' => 'disciplina', 'label' => 'Disciplina', 'default' => true],
                    ['key' => 'aulas', 'label' => 'Aulas no dia', 'default' => true],
                    ['key' => 'presentes', 'label' => 'Presentes', 'default' => true],
                    ['key' => 'faltas', 'label' => 'Faltas', 'default' => true],
                    ['key' => 'taxa', 'label' => 'Taxa presenca %', 'default' => true],
                ]),
                self::section('attendance_marks_table', 'Tabela — Detalhe de frequencia', 'Marcacao por aluno e data', 'table', true, true, [
                    ['key' => 'data', 'label' => 'Data', 'default' => true],
                    ['key' => 'turma', 'label' => 'Turma', 'default' => true],
                    ['key' => 'matricula', 'label' => 'Matricula', 'default' => true],
                    ['key' => 'aluno', 'label' => 'Aluno', 'default' => true],
                    ['key' => 'situacao', 'label' => 'Situacao', 'default' => true],
                    ['key' => 'aulas_faltadas', 'label' => 'Aulas faltadas', 'default' => true],
                ]),
                self::section('class_attendance_ranking', 'Ranking — Presenca por turma', 'Turmas ordenadas por taxa de presenca', 'table', true, false),
            ],
            'presets' => [
                [
                    'id' => 'academic_full',
                    'label' => 'Completo academico',
                    'sections' => ['cover', 'executive_summary', 'kpi_cards', 'attendance_breakdown_chart', 'students_by_course_chart', 'students_table', 'classes_table', 'attendance_sessions_table'],
                ],
                [
                    'id' => 'attendance_focus',
                    'label' => 'Foco em frequencia',
                    'sections' => ['cover', 'kpi_cards', 'attendance_breakdown_chart', 'class_attendance_ranking', 'attendance_marks_table'],
                ],
                [
                    'id' => 'enrollment',
                    'label' => 'Matriculas e turmas',
                    'sections' => ['cover', 'executive_summary', 'kpi_cards', 'students_table', 'classes_table', 'teachers_table'],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function gridSchema(): array
    {
        return [
            'module' => 'grid',
            'module_label' => 'SENAI Grid',
            'default_title' => 'Relatorio de Manutencao',
            'filters' => [
                ['key' => 'ticket_status', 'label' => 'Status do chamado', 'type' => 'select', 'options' => [
                    ['value' => '', 'label' => 'Todos'],
                    ['value' => 'aberto', 'label' => 'Aberto'],
                    ['value' => 'pendente', 'label' => 'Pendente'],
                    ['value' => 'em_atendimento', 'label' => 'Em atendimento'],
                    ['value' => 'aguardando_aprovacao', 'label' => 'Aguardando aprovacao'],
                    ['value' => 'avaliacao_pendente', 'label' => 'Avaliacao pendente'],
                    ['value' => 'concluido', 'label' => 'Concluido'],
                ]],
                ['key' => 'priority', 'label' => 'Prioridade', 'type' => 'select', 'options' => [
                    ['value' => '', 'label' => 'Todas'],
                    ['value' => 'critica', 'label' => 'Critica'],
                    ['value' => 'alta', 'label' => 'Alta'],
                    ['value' => 'media', 'label' => 'Media'],
                    ['value' => 'baixa', 'label' => 'Baixa'],
                ]],
                ['key' => 'block', 'label' => 'Bloco', 'type' => 'text'],
            ],
            'sections' => [
                self::section('cover', 'Capa', 'Titulo, periodo e filtros', 'layout', true, false),
                self::section('executive_summary', 'Resumo executivo', 'Sintese dos indicadores', 'summary', true, false),
                self::section('kpi_cards', 'Indicadores (KPIs)', 'Metricas de chamados e estoque', 'kpis', true, false),
                self::section('tickets_by_status_chart', 'Grafico — Chamados por status', 'Distribuicao do backlog', 'chart', true, false),
                self::section('tickets_by_month_chart', 'Grafico — Chamados por mes', 'Volume ao longo do tempo', 'chart', true, false),
                self::section('tickets_by_technician_chart', 'Grafico — Por tecnico', 'Carga por responsavel', 'chart', true, false),
                self::section('tickets_table', 'Tabela — Chamados', 'Lista de chamados', 'table', true, true, [
                    ['key' => 'codigo', 'label' => 'Codigo', 'default' => true],
                    ['key' => 'titulo', 'label' => 'Titulo', 'default' => true],
                    ['key' => 'solicitante', 'label' => 'Solicitante', 'default' => true],
                    ['key' => 'responsavel', 'label' => 'Responsavel', 'default' => true],
                    ['key' => 'prioridade', 'label' => 'Prioridade', 'default' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                    ['key' => 'sala', 'label' => 'Sala', 'default' => true],
                    ['key' => 'bloco', 'label' => 'Bloco', 'default' => true],
                    ['key' => 'aberto_em', 'label' => 'Aberto em', 'default' => true],
                ]),
                self::section('tasks_table', 'Tabela — Tarefas', 'Tarefas vinculadas', 'table', true, true, [
                    ['key' => 'codigo', 'label' => 'Codigo', 'default' => true],
                    ['key' => 'titulo', 'label' => 'Titulo', 'default' => true],
                    ['key' => 'chamado', 'label' => 'Chamado', 'default' => true],
                    ['key' => 'responsavel', 'label' => 'Responsavel', 'default' => true],
                    ['key' => 'coluna', 'label' => 'Coluna', 'default' => true],
                    ['key' => 'prioridade', 'label' => 'Prioridade', 'default' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                ]),
                self::section('inventory_table', 'Tabela — Estoque', 'Itens de inventario', 'table', true, true, [
                    ['key' => 'titulo', 'label' => 'Item', 'default' => true],
                    ['key' => 'categoria', 'label' => 'Categoria', 'default' => true],
                    ['key' => 'disponivel', 'label' => 'Disponivel', 'default' => true],
                    ['key' => 'minimo', 'label' => 'Minimo', 'default' => true],
                    ['key' => 'local', 'label' => 'Local', 'default' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true],
                ]),
                self::section('low_stock_table', 'Tabela — Estoque critico', 'Itens abaixo do minimo', 'table', true, false),
            ],
            'presets' => [
                [
                    'id' => 'operations_full',
                    'label' => 'Operacao completa',
                    'sections' => ['cover', 'executive_summary', 'kpi_cards', 'tickets_by_status_chart', 'tickets_by_month_chart', 'tickets_table', 'tasks_table'],
                ],
                [
                    'id' => 'maintenance_kpis',
                    'label' => 'Indicadores de manutencao',
                    'sections' => ['cover', 'kpi_cards', 'tickets_by_status_chart', 'tickets_by_technician_chart', 'tickets_table'],
                ],
                [
                    'id' => 'inventory',
                    'label' => 'Estoque e materiais',
                    'sections' => ['cover', 'kpi_cards', 'inventory_table', 'low_stock_table'],
                ],
            ],
        ];
    }

    /**
     * @param  list<array{key: string, label: string, default?: bool}>|null  $columns
     * @return array<string, mixed>
     */
    private static function section(
        string $id,
        string $label,
        string $description,
        string $type,
        bool $defaultEnabled,
        bool $hasColumns,
        ?array $columns = null,
    ): array {
        return [
            'id' => $id,
            'label' => $label,
            'description' => $description,
            'type' => $type,
            'default_enabled' => $defaultEnabled,
            'has_columns' => $hasColumns,
            'columns' => $columns,
        ];
    }
}
