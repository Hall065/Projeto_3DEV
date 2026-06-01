<?php

namespace App\Services\Reports;

use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Models\User;
use App\Support\Reports\ReportSchemaRegistry;
use App\Support\UserAccessScope;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ConnectReportBuilderService
{
    private ?User $actingUser = null;

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function build(array $config, ?User $user = null): array
    {
        $this->actingUser = $user;

        $from = ! empty($config['from_date']) ? Carbon::parse($config['from_date'])->startOfDay() : null;
        $to = ! empty($config['to_date']) ? Carbon::parse($config['to_date'])->endOfDay() : null;
        $filters = $config['filters'] ?? [];
        $sections = $config['sections'] ?? [];
        $columns = $config['columns'] ?? [];

        $metrics = $this->computeMetrics($filters, $from, $to, $user);

        $built = [];
        foreach ($sections as $sectionId) {
            $section = $this->buildSection($sectionId, $metrics, $filters, $from, $to, $columns);
            if ($section !== null) {
                $built[] = $section;
            }
        }

        $result = [
            'meta' => [
                'module' => 'connect',
                'module_label' => 'SENAI Connect',
                'title' => $config['title'] ?? 'Relatorio Academico',
                'subtitle' => $config['subtitle'] ?? '',
                'from_date' => $from?->toDateString(),
                'to_date' => $to?->toDateString(),
                'filters' => $this->humanFilters($filters),
                'generated_at' => now()->format('d/m/Y H:i'),
                'sections_count' => count($built),
            ],
            'sections' => $built,
        ];

        $this->actingUser = null;

        return $result;
    }

    /** @return \Illuminate\Database\Eloquent\Builder<ConnectClass> */
    private function connectClassQuery()
    {
        return $this->actingUser
            ? UserAccessScope::connectClassQuery($this->actingUser)
            : ConnectClass::query();
    }

    /** @return \Illuminate\Database\Eloquent\Builder<ConnectAttendanceMark> */
    private function attendanceMarkQuery()
    {
        return $this->actingUser
            ? UserAccessScope::attendanceMarkQuery($this->actingUser)
            : ConnectAttendanceMark::query();
    }

    /** @param  \Illuminate\Database\Eloquent\Builder<ConnectAttendanceSession>  $query */
    private function scopeSessionsToUser($query): void
    {
        if (! $this->actingUser) {
            return;
        }

        $classIds = $this->connectClassQuery()->pluck('id');
        $query->whereIn('connect_class_id', $classIds);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function computeMetrics(array $filters, ?Carbon $from, ?Carbon $to, ?User $user = null): array
    {
        $studentsQuery = $user
            ? UserAccessScope::connectStudentQuery($user)->with(['connectClass.course'])
            : ConnectStudent::query()->with(['connectClass.course']);
        $this->applyStudentFilters($studentsQuery, $filters);

        $students = $studentsQuery->get();
        $teachers = ConnectTeacher::query()->where('status', 'active')->count();

        $classesQuery = $user
            ? UserAccessScope::connectClassQuery($user)
            : ConnectClass::query();
        $classes = $classesQuery
            ->when(
                ! empty($filters['connect_class_id']),
                fn ($q) => $q->whereKey($filters['connect_class_id']),
            )
            ->when(
                ! empty($filters['connect_course_id']),
                fn ($q) => $q->where('connect_course_id', $filters['connect_course_id']),
            )
            ->count();

        $marksQuery = ($user ? UserAccessScope::attendanceMarkQuery($user) : ConnectAttendanceMark::query())
            ->whereHas('session', function ($q) use ($filters, $from, $to): void {
            if ($from) {
                $q->whereDate('session_date', '>=', $from);
            }
            if ($to) {
                $q->whereDate('session_date', '<=', $to);
            }
            if (! empty($filters['connect_class_id'])) {
                $q->where('connect_class_id', $filters['connect_class_id']);
            }
        });

        $marks = $marksQuery->get();
        $totalMarks = max($marks->count(), 1);
        $present = $marks->whereIn('status', ['present', 'late'])->count();
        $justified = $marks->where('status', 'justified')->count();
        $absent = $marks->where('status', 'absent')->count();

        return [
            'students' => $students,
            'total_students' => $students->count(),
            'active_students' => $students->where('status', 'active')->count(),
            'total_teachers' => $teachers,
            'active_classes' => $classes,
            'active_contracts' => ConnectContract::query()->where('status', 'active')->count(),
            'attendance_rate' => round(($present / $totalMarks) * 100, 1),
            'attendance_breakdown' => [
                ['label' => 'Presentes', 'value' => $present, 'color' => '#10b981'],
                ['label' => 'Falta justificada', 'value' => $justified, 'color' => '#f59e0b'],
                ['label' => 'Falta injustificada', 'value' => $absent, 'color' => '#ef4444'],
            ],
            'students_by_course' => $this->studentsByCourse($students),
            'marks' => $marks,
        ];
    }

    /**
     * @param  Collection<int, ConnectStudent>  $students
     * @return list<array{label: string, value: int}>
     */
    private function studentsByCourse(Collection $students): array
    {
        return $students
            ->groupBy(fn (ConnectStudent $s) => $s->connectClass?->course?->name ?? 'Sem curso')
            ->map(fn (Collection $group, string $name) => ['label' => $name, 'value' => $group->count()])
            ->values()
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $metrics
     * @param  array<string, mixed>  $filters
     * @param  array<string, list<string>>  $columns
     * @return array<string, mixed>|null
     */
    private function buildSection(
        string $id,
        array $metrics,
        array $filters,
        ?Carbon $from,
        ?Carbon $to,
        array $columns,
    ): ?array {
        return match ($id) {
            'cover' => [
                'id' => $id,
                'type' => 'cover',
                'title' => 'Capa',
            ],
            'executive_summary' => [
                'id' => $id,
                'type' => 'summary',
                'title' => 'Resumo executivo',
                'paragraphs' => [
                    "No periodo analisado, o Connect registra {$metrics['total_students']} aluno(s) no recorte selecionado, com {$metrics['active_students']} ativo(s).",
                    "A taxa de presenca consolidada nas marcacoes do periodo e de {$metrics['attendance_rate']}%, considerando presentes e atrasos.",
                    "Ha {$metrics['active_classes']} turma(s) ativa(s), {$metrics['total_teachers']} professor(es) ativo(s) e {$metrics['active_contracts']} contrato(s) vigente(s).",
                ],
            ],
            'kpi_cards' => [
                'id' => $id,
                'type' => 'kpis',
                'title' => 'Indicadores',
                'items' => [
                    ['label' => 'Alunos no recorte', 'value' => (string) $metrics['total_students'], 'variant' => 'blue'],
                    ['label' => 'Taxa de presenca', 'value' => $metrics['attendance_rate'].'%', 'variant' => 'green'],
                    ['label' => 'Turmas ativas', 'value' => (string) $metrics['active_classes'], 'variant' => 'coral'],
                    ['label' => 'Professores ativos', 'value' => (string) $metrics['total_teachers'], 'variant' => 'violet'],
                    ['label' => 'Contratos ativos', 'value' => (string) $metrics['active_contracts'], 'variant' => 'amber'],
                ],
            ],
            'attendance_breakdown_chart' => [
                'id' => $id,
                'type' => 'chart',
                'chart_kind' => 'donut',
                'title' => 'Frequencia no periodo',
                'items' => $metrics['attendance_breakdown'],
            ],
            'students_by_course_chart' => [
                'id' => $id,
                'type' => 'chart',
                'chart_kind' => 'bar',
                'title' => 'Alunos por curso',
                'items' => $metrics['students_by_course'],
            ],
            'students_table' => $this->tableSection($id, 'Alunos', $this->studentsRows($metrics['students']), $columns['students_table'] ?? null, 'students_table'),
            'teachers_table' => $this->tableSection($id, 'Professores', $this->teachersRows($filters), $columns['teachers_table'] ?? null, 'teachers_table'),
            'classes_table' => $this->tableSection($id, 'Turmas', $this->classesRows($filters), $columns['classes_table'] ?? null, 'classes_table'),
            'contracts_table' => $this->tableSection($id, 'Contratos', $this->contractsRows($filters), $columns['contracts_table'] ?? null, 'contracts_table'),
            'attendance_sessions_table' => $this->tableSection(
                $id,
                'Sessoes de frequencia',
                $this->attendanceSessionsRows($filters, $from, $to),
                $columns['attendance_sessions_table'] ?? null,
                'attendance_sessions_table',
            ),
            'attendance_marks_table' => $this->tableSection(
                $id,
                'Detalhe de frequencia',
                $this->attendanceMarksRows($filters, $from, $to),
                $columns['attendance_marks_table'] ?? null,
                'attendance_marks_table',
            ),
            'class_attendance_ranking' => $this->tableSection(
                $id,
                'Presenca por turma',
                $this->classRankingRows($filters, $from, $to),
                ['turma', 'sessoes', 'taxa', 'presentes', 'faltas'],
                null,
            ),
            default => null,
        };
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @param  list<string>|null  $selectedColumns
     */
    private function tableSection(string $id, string $title, array $rows, ?array $selectedColumns, ?string $schemaKey): array
    {
        $allColumns = $this->columnDefs($schemaKey, $rows);
        $keys = $selectedColumns ?? array_column($allColumns, 'key');

        return [
            'id' => $id,
            'type' => 'table',
            'title' => $title,
            'columns' => array_values(array_filter($allColumns, fn ($c) => in_array($c['key'], $keys, true))),
            'rows' => array_map(function (array $row) use ($keys) {
                $filtered = [];
                foreach ($keys as $key) {
                    $filtered[$key] = $row[$key] ?? '';
                }

                return $filtered;
            }, $rows),
            'total_rows' => count($rows),
        ];
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @return list<array{key: string, label: string}>
     */
    private function columnDefs(?string $schemaKey, array $rows): array
    {
        if ($schemaKey) {
            $schema = ReportSchemaRegistry::schema('connect');
            foreach ($schema['sections'] ?? [] as $section) {
                if (($section['id'] ?? '') === $schemaKey && ! empty($section['columns'])) {
                    return array_map(fn ($c) => ['key' => $c['key'], 'label' => $c['label']], $section['columns']);
                }
            }
        }

        if ($rows === []) {
            return [];
        }

        return array_map(fn ($key) => ['key' => $key, 'label' => $key], array_keys($rows[0]));
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<ConnectStudent>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyStudentFilters($query, array $filters): void
    {
        if (! empty($filters['connect_class_id'])) {
            $query->where('connect_class_id', $filters['connect_class_id']);
        }
        if (! empty($filters['connect_course_id'])) {
            $query->whereHas('connectClass', fn ($q) => $q->where('connect_course_id', $filters['connect_course_id']));
        }
        if (! empty($filters['student_status'])) {
            $query->where('status', $filters['student_status']);
        }
    }

    /**
     * @param  Collection<int, ConnectStudent>  $students
     * @return list<array<string, string>>
     */
    private function studentsRows(Collection $students): array
    {
        return $students->map(fn (ConnectStudent $s) => [
            'matricula' => $s->registration_number ?? '',
            'nome' => $s->full_name,
            'cpf' => $s->cpf ?? '',
            'email' => $s->email ?? '',
            'telefone' => $s->phone ?? '',
            'turma' => $s->connectClass?->name ?? '',
            'curso' => $s->connectClass?->course?->name ?? '',
            'status' => $s->status,
            'data_nascimento' => $s->birth_date?->format('d/m/Y') ?? '',
        ])->values()->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, string>>
     */
    private function teachersRows(array $filters): array
    {
        return ConnectTeacher::query()
            ->orderBy('full_name')
            ->get()
            ->map(fn (ConnectTeacher $t) => [
                'nome' => $t->full_name,
                'email' => $t->email,
                'especialidade' => $t->specialty ?? '',
                'telefone' => $t->phone ?? '',
                'status' => $t->status,
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, string>>
     */
    private function classesRows(array $filters): array
    {
        $query = $this->connectClassQuery()->with(['course', 'teacher'])->withCount('students');

        if (! empty($filters['connect_class_id'])) {
            $query->whereKey($filters['connect_class_id']);
        }
        if (! empty($filters['connect_course_id'])) {
            $query->where('connect_course_id', $filters['connect_course_id']);
        }

        return $query->orderBy('code')->get()->map(fn (ConnectClass $c) => [
            'codigo' => $c->code,
            'nome' => $c->name,
            'curso' => $c->course?->name ?? '',
            'professor' => $c->teacher?->full_name ?? '',
            'turno' => $c->shift ?? '',
            'alunos' => (string) $c->students_count,
            'status' => $c->status,
        ])->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, string>>
     */
    private function contractsRows(array $filters): array
    {
        $query = ConnectContract::query()->with('student.connectClass');

        if (! empty($filters['connect_class_id'])) {
            $query->whereHas('student', fn ($q) => $q->where('connect_class_id', $filters['connect_class_id']));
        }

        return $query->orderByDesc('start_date')->get()->map(fn (ConnectContract $c) => [
            'matricula' => $c->student?->registration_number ?? '',
            'aluno' => $c->student?->full_name ?? '',
            'tipo' => $c->contract_type,
            'empresa' => $c->company_name ?? '',
            'valor_mensal' => number_format((float) $c->monthly_value, 2, ',', '.'),
            'inicio' => $c->start_date?->format('d/m/Y') ?? '',
            'fim' => $c->end_date?->format('d/m/Y') ?? '',
            'status' => $c->status,
        ])->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function attendanceSessionsRows(array $filters, ?Carbon $from, ?Carbon $to): array
    {
        $query = ConnectAttendanceSession::query()
            ->with('connectClass')
            ->withCount([
                'marks',
                'marks as present_count' => fn ($q) => $q->whereIn('status', ['present', 'late']),
                'marks as absent_count' => fn ($q) => $q->where('status', 'absent'),
            ]);

        if ($from) {
            $query->whereDate('session_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('session_date', '<=', $to);
        }
        if (! empty($filters['connect_class_id'])) {
            $query->where('connect_class_id', $filters['connect_class_id']);
        }
        $this->scopeSessionsToUser($query);

        return $query->orderByDesc('session_date')->limit(500)->get()->map(function (ConnectAttendanceSession $s) {
            $total = max((int) $s->marks_count, 1);
            $rate = round(((int) $s->present_count / $total) * 100, 1);

            return [
                'data' => $s->session_date?->format('d/m/Y') ?? '',
                'turma' => $s->connectClass?->name ?? '',
                'disciplina' => $s->subject ?? '',
                'aulas' => (string) ($s->lessons_count ?? 4),
                'presentes' => (string) $s->present_count,
                'faltas' => (string) $s->absent_count,
                'taxa' => $rate.'%',
            ];
        })->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function attendanceMarksRows(array $filters, ?Carbon $from, ?Carbon $to): array
    {
        $query = $this->attendanceMarkQuery()
            ->with(['session.connectClass', 'student'])
            ->whereHas('session', function ($q) use ($filters, $from, $to): void {
                if ($from) {
                    $q->whereDate('session_date', '>=', $from);
                }
                if ($to) {
                    $q->whereDate('session_date', '<=', $to);
                }
                if (! empty($filters['connect_class_id'])) {
                    $q->where('connect_class_id', $filters['connect_class_id']);
                }
            });

        return $query->orderByDesc('id')->limit(1000)->get()->map(fn (ConnectAttendanceMark $m) => [
            'data' => $m->session?->session_date?->format('d/m/Y') ?? '',
            'turma' => $m->session?->connectClass?->name ?? '',
            'matricula' => $m->student?->registration_number ?? '',
            'aluno' => $m->student?->full_name ?? '',
            'situacao' => $m->status,
            'aulas_faltadas' => (string) ($m->missed_lessons ?? 0),
        ])->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function classRankingRows(array $filters, ?Carbon $from, ?Carbon $to): array
    {
        $classes = $this->connectClassQuery()
            ->when(! empty($filters['connect_class_id']), fn ($q) => $q->whereKey($filters['connect_class_id']))
            ->when(! empty($filters['connect_course_id']), fn ($q) => $q->where('connect_course_id', $filters['connect_course_id']))
            ->get();

        $rows = [];
        foreach ($classes as $class) {
            $marks = $this->attendanceMarkQuery()
                ->whereHas('session', function ($q) use ($class, $from, $to): void {
                    $q->where('connect_class_id', $class->id);
                    if ($from) {
                        $q->whereDate('session_date', '>=', $from);
                    }
                    if ($to) {
                        $q->whereDate('session_date', '<=', $to);
                    }
                })
                ->get();

            if ($marks->isEmpty()) {
                continue;
            }

            $sessions = $marks->pluck('connect_attendance_session_id')->unique()->count();
            $present = $marks->whereIn('status', ['present', 'late'])->count();
            $rate = round(($present / max($marks->count(), 1)) * 100, 1);

            $rows[] = [
                'turma' => $class->name,
                'sessoes' => (string) $sessions,
                'taxa' => $rate.'%',
                'presentes' => (string) $present,
                'faltas' => (string) $marks->where('status', 'absent')->count(),
            ];
        }

        usort($rows, fn ($a, $b) => (int) filter_var($b['taxa'], FILTER_SANITIZE_NUMBER_INT) <=> (int) filter_var($a['taxa'], FILTER_SANITIZE_NUMBER_INT));

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array{label: string, value: string}>
     */
    private function humanFilters(array $filters): array
    {
        $out = [];
        if (! empty($filters['connect_course_id'])) {
            $course = ConnectCourse::query()->find($filters['connect_course_id']);
            $out[] = ['label' => 'Curso', 'value' => $course?->name ?? (string) $filters['connect_course_id']];
        }
        if (! empty($filters['connect_class_id'])) {
            $class = $this->connectClassQuery()->find($filters['connect_class_id']);
            $out[] = ['label' => 'Turma', 'value' => $class?->name ?? (string) $filters['connect_class_id']];
        }
        if (! empty($filters['student_status'])) {
            $out[] = ['label' => 'Status aluno', 'value' => (string) $filters['student_status']];
        }

        return $out;
    }
}
