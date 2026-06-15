<?php

namespace App\Services\Spreadsheet;

use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Models\HubPerson;
use App\Services\Connect\ConnectEnrollmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ConnectSpreadsheetHandler
{
    public function __construct(
        private readonly ConnectEnrollmentService $enrollment,
    ) {}

    /**
     * @return \Generator<int, array<string, string|null>>
     */
    public function export(string $key, Request $request): \Generator
    {
        return match ($key) {
            'people' => $this->exportPeople(),
            'students' => $this->exportStudents($request),
            'teachers' => $this->exportTeachers(),
            'courses' => $this->exportCourses(),
            'classes' => $this->exportClasses(),
            'contracts' => $this->exportContracts($request),
            'attendance' => $this->exportAttendance($request),
            'attendance_sessions' => $this->exportAttendanceSessions($request),
            default => throw ValidationException::withMessages(['key' => 'Planilha Connect nao encontrada.']),
        };
    }

    /**
     * @param  list<array<string, string>>  $rows
     * @return array{created: int, updated: int, errors: list<array{row: int, message: string}>}
     */
    public function import(string $key, array $rows): array
    {
        return match ($key) {
            'people' => $this->importPeople($rows),
            'students' => $this->importStudents($rows),
            'teachers' => $this->importTeachers($rows),
            'courses' => $this->importCourses($rows),
            'classes' => $this->importClasses($rows),
            'contracts' => $this->importContracts($rows),
            'attendance' => $this->importAttendance($rows),
            default => throw ValidationException::withMessages(['key' => 'Importacao nao disponivel para esta planilha.']),
        };
    }

    private function exportPeople(): \Generator
    {
        foreach (HubPerson::query()->orderBy('full_name')->cursor() as $person) {
            yield [
                'tipo' => $person->kind,
                'nome_completo' => $person->full_name,
                'cpf' => $person->cpf,
                'email' => $person->email,
                'telefone' => $person->phone,
                'matricula' => $person->registration_number,
                'data_nascimento' => $person->birth_date?->format('Y-m-d'),
                'especialidade' => $person->specialty,
                'status' => $person->status,
            ];
        }
    }

    private function exportStudents(Request $request): \Generator
    {
        $query = ConnectStudent::query()->with('connectClass')->orderBy('full_name');

        if ($request->filled('connect_class_id')) {
            $query->where('connect_class_id', $request->integer('connect_class_id'));
        }

        foreach ($query->cursor() as $student) {
            yield [
                'matricula' => $student->registration_number,
                'nome_completo' => $student->full_name,
                'cpf' => $student->cpf,
                'email' => $student->email,
                'telefone' => $student->phone,
                'data_nascimento' => $student->birth_date?->format('Y-m-d'),
                'status' => $student->status,
                'codigo_turma' => $student->connectClass?->code,
            ];
        }
    }

    private function exportTeachers(): \Generator
    {
        foreach (ConnectTeacher::query()->orderBy('full_name')->cursor() as $teacher) {
            yield [
                'nome_completo' => $teacher->full_name,
                'cpf' => $teacher->cpf,
                'email' => $teacher->email,
                'telefone' => $teacher->phone,
                'especialidade' => $teacher->specialty,
                'status' => $teacher->status,
            ];
        }
    }

    private function exportCourses(): \Generator
    {
        foreach (ConnectCourse::query()->orderBy('code')->cursor() as $course) {
            yield [
                'codigo' => $course->code,
                'nome' => $course->name,
                'descricao' => $course->description,
                'carga_horaria' => (string) $course->workload_hours,
                'area' => $course->area,
                'status' => $course->status,
            ];
        }
    }

    private function exportClasses(): \Generator
    {
        foreach (ConnectClass::query()->with(['course', 'teacher'])->orderBy('code')->cursor() as $class) {
            yield [
                'codigo' => $class->code,
                'nome' => $class->name,
                'codigo_curso' => $class->course?->code,
                'email_professor' => $class->teacher?->email,
                'turno' => $class->shift,
                'data_inicio' => $class->start_date?->format('Y-m-d'),
                'data_fim' => $class->end_date?->format('Y-m-d'),
                'capacidade' => $class->capacity !== null ? (string) $class->capacity : '',
                'aulas_por_dia' => (string) ($class->default_lessons_per_day ?? 4),
                'status' => $class->status,
            ];
        }
    }

    private function exportContracts(Request $request): \Generator
    {
        $query = ConnectContract::query()->with('student')->orderByDesc('start_date');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        foreach ($query->cursor() as $contract) {
            yield [
                'matricula_aluno' => $contract->student?->registration_number,
                'tipo_contrato' => $contract->contract_type,
                'data_inicio' => $contract->start_date?->format('Y-m-d'),
                'data_fim' => $contract->end_date?->format('Y-m-d'),
                'valor_mensal' => (string) $contract->monthly_value,
                'empresa' => $contract->company_name,
                'status' => $contract->status,
            ];
        }
    }

    private function exportAttendance(Request $request): \Generator
    {
        $query = ConnectAttendanceMark::query()
            ->with(['session.connectClass', 'student'])
            ->whereHas('session');

        if ($request->filled('connect_class_id')) {
            $query->whereHas('session', fn ($q) => $q->where('connect_class_id', $request->integer('connect_class_id')));
        }

        if ($request->filled('from_date')) {
            $query->whereHas('session', fn ($q) => $q->whereDate('session_date', '>=', $request->string('from_date')->toString()));
        }

        if ($request->filled('to_date')) {
            $query->whereHas('session', fn ($q) => $q->whereDate('session_date', '<=', $request->string('to_date')->toString()));
        }

        foreach ($query->orderByDesc('id')->cursor() as $mark) {
            yield [
                'codigo_turma' => $mark->session?->connectClass?->code,
                'data_sessao' => $mark->session?->session_date?->format('Y-m-d'),
                'disciplina' => $mark->session?->subject,
                'matricula_aluno' => $mark->student?->registration_number,
                'situacao' => $mark->status,
                'aulas_faltadas' => (string) ($mark->missed_lessons ?? 0),
            ];
        }
    }

    private function exportAttendanceSessions(Request $request): \Generator
    {
        $query = ConnectAttendanceSession::query()
            ->with(['connectClass'])
            ->withCount([
                'marks',
                'marks as present_count' => fn ($q) => $q->whereIn('status', ['present', 'late']),
                'marks as absent_count' => fn ($q) => $q->where('status', 'absent'),
            ])
            ->orderByDesc('session_date');

        if ($request->filled('connect_class_id')) {
            $query->where('connect_class_id', $request->integer('connect_class_id'));
        }

        foreach ($query->cursor() as $session) {
            yield [
                'codigo_turma' => $session->connectClass?->code,
                'turma' => $session->connectClass?->name,
                'data_sessao' => $session->session_date?->format('Y-m-d'),
                'disciplina' => $session->subject,
                'aulas_no_dia' => (string) ($session->lessons_count ?? 4),
                'status_sessao' => $session->status,
                'total_alunos' => (string) $session->marks_count,
                'presentes' => (string) $session->present_count,
                'faltas' => (string) $session->absent_count,
            ];
        }
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importPeople(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'tipo' => ['required', Rule::in(['student', 'teacher', 'staff', 'other'])],
                    'nome_completo' => ['required', 'string', 'max:255'],
                    'cpf' => ['nullable', 'string', 'max:14'],
                    'email' => ['nullable', 'email', 'max:255'],
                    'telefone' => ['nullable', 'string', 'max:20'],
                    'matricula' => ['nullable', 'string', 'max:50'],
                    'data_nascimento' => ['nullable', 'date'],
                    'especialidade' => ['nullable', 'string', 'max:255'],
                    'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
                ])->validate();

                $lookup = HubPerson::query()
                    ->when(
                        ! empty($validated['matricula']),
                        fn ($q) => $q->where('registration_number', $validated['matricula']),
                        fn ($q) => ! empty($validated['cpf'])
                            ? $q->where('cpf', $validated['cpf'])
                            : (! empty($validated['email']) ? $q->where('email', $validated['email']) : $q->whereRaw('1 = 0')),
                    )
                    ->first();

                $payload = [
                    'kind' => $validated['tipo'],
                    'full_name' => $validated['nome_completo'],
                    'cpf' => $validated['cpf'] ?? null,
                    'email' => $validated['email'] ?? null,
                    'phone' => $validated['telefone'] ?? null,
                    'registration_number' => $validated['matricula'] ?? null,
                    'birth_date' => $validated['data_nascimento'] ?? null,
                    'specialty' => $validated['especialidade'] ?? null,
                    'status' => $validated['status'] ?? 'active',
                ];

                if ($lookup) {
                    $lookup->update($payload);
                    $stats['updated']++;
                } else {
                    HubPerson::query()->create($payload);
                    $stats['created']++;
                }
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importStudents(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'matricula' => ['required', 'string', 'max:50'],
                    'nome_completo' => ['required', 'string', 'max:255'],
                    'cpf' => ['nullable', 'string', 'max:14'],
                    'email' => ['nullable', 'email', 'max:255'],
                    'telefone' => ['nullable', 'string', 'max:20'],
                    'data_nascimento' => ['nullable', 'date'],
                    'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
                    'codigo_turma' => ['nullable', 'string', 'max:50'],
                ])->validate();

                $classId = null;
                if (! empty($validated['codigo_turma'])) {
                    $class = ConnectClass::query()->where('code', $validated['codigo_turma'])->first();
                    if (! $class) {
                        throw ValidationException::withMessages(['codigo_turma' => "Turma {$validated['codigo_turma']} nao encontrada."]);
                    }
                    $classId = $class->id;
                }

                $existing = ConnectStudent::query()
                    ->where('registration_number', $validated['matricula'])
                    ->first();

                DB::transaction(function () use ($validated, $classId, $existing, &$stats): void {
                    $profile = [
                        'full_name' => $validated['nome_completo'],
                        'cpf' => $validated['cpf'] ?? null,
                        'registration_number' => $validated['matricula'],
                        'email' => $validated['email'] ?? null,
                        'phone' => $validated['telefone'] ?? null,
                        'birth_date' => $validated['data_nascimento'] ?? null,
                        'status' => $validated['status'] ?? 'active',
                    ];

                    if ($existing) {
                        if ($existing->hubPerson) {
                            $existing->hubPerson->update($profile);
                        }
                        $existing->update([...$profile, 'connect_class_id' => $classId]);
                        $this->enrollment->syncPivotsForStudent($existing->fresh());
                        $stats['updated']++;
                    } else {
                        $person = HubPerson::query()->create([
                            'kind' => 'student',
                            ...$profile,
                        ]);
                        $student = ConnectStudent::query()->create([
                            'hub_person_id' => $person->id,
                            'connect_class_id' => $classId,
                            ...$profile,
                        ]);
                        $this->enrollment->syncPivotsForStudent($student);
                        $stats['created']++;
                    }
                });
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importTeachers(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'nome_completo' => ['required', 'string', 'max:255'],
                    'cpf' => ['nullable', 'string', 'max:14'],
                    'email' => ['required', 'email', 'max:255'],
                    'telefone' => ['nullable', 'string', 'max:20'],
                    'especialidade' => ['nullable', 'string', 'max:255'],
                    'status' => ['nullable', Rule::in(['active', 'inactive'])],
                ])->validate();

                $existing = ConnectTeacher::query()->where('email', $validated['email'])->first()
                    ?? (! empty($validated['cpf'])
                        ? ConnectTeacher::query()->where('cpf', $validated['cpf'])->first()
                        : null);

                DB::transaction(function () use ($validated, $existing, &$stats): void {
                    $payload = [
                        'full_name' => $validated['nome_completo'],
                        'cpf' => $validated['cpf'] ?? null,
                        'email' => $validated['email'],
                        'phone' => $validated['telefone'] ?? null,
                        'specialty' => $validated['especialidade'] ?? null,
                        'status' => $validated['status'] ?? 'active',
                    ];

                    if ($existing) {
                        if ($existing->hubPerson) {
                            $existing->hubPerson->update([
                                'kind' => 'teacher',
                                'full_name' => $payload['full_name'],
                                'cpf' => $payload['cpf'],
                                'email' => $payload['email'],
                                'phone' => $payload['phone'],
                                'specialty' => $payload['specialty'],
                                'status' => $payload['status'],
                            ]);
                        }
                        $existing->update($payload);
                        $stats['updated']++;
                    } else {
                        $person = HubPerson::query()->create([
                            'kind' => 'teacher',
                            'full_name' => $payload['full_name'],
                            'cpf' => $payload['cpf'],
                            'email' => $payload['email'],
                            'phone' => $payload['phone'],
                            'specialty' => $payload['specialty'],
                            'status' => $payload['status'],
                        ]);
                        ConnectTeacher::query()->create([
                            'hub_person_id' => $person->id,
                            ...$payload,
                        ]);
                        $stats['created']++;
                    }
                });
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importCourses(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'codigo' => ['required', 'string', 'max:50'],
                    'nome' => ['required', 'string', 'max:255'],
                    'descricao' => ['nullable', 'string'],
                    'carga_horaria' => ['nullable', 'integer', 'min:0'],
                    'area' => ['nullable', 'string', 'max:100'],
                    'status' => ['nullable', Rule::in(['active', 'inactive'])],
                ])->validate();

                $course = ConnectCourse::query()->updateOrCreate(
                    ['code' => $validated['codigo']],
                    [
                        'name' => $validated['nome'],
                        'description' => $validated['descricao'] ?? null,
                        'workload_hours' => $validated['carga_horaria'] ?? 0,
                        'area' => $validated['area'] ?? null,
                        'status' => $validated['status'] ?? 'active',
                    ],
                );

                $course->wasRecentlyCreated ? $stats['created']++ : $stats['updated']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importClasses(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'codigo' => ['required', 'string', 'max:50'],
                    'nome' => ['required', 'string', 'max:255'],
                    'codigo_curso' => ['nullable', 'string', 'max:50'],
                    'email_professor' => ['nullable', 'email', 'max:255'],
                    'turno' => ['nullable', Rule::in(['manha', 'tarde', 'noite'])],
                    'data_inicio' => ['nullable', 'date'],
                    'data_fim' => ['nullable', 'date'],
                    'capacidade' => ['nullable', 'integer', 'min:1'],
                    'aulas_por_dia' => ['nullable', 'integer', 'min:1', 'max:5'],
                    'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
                ])->validate();

                $courseId = null;
                if (! empty($validated['codigo_curso'])) {
                    $course = ConnectCourse::query()->where('code', $validated['codigo_curso'])->first();
                    if (! $course) {
                        throw ValidationException::withMessages(['codigo_curso' => 'Curso nao encontrado.']);
                    }
                    $courseId = $course->id;
                }

                $teacherId = null;
                if (! empty($validated['email_professor'])) {
                    $teacher = ConnectTeacher::query()->where('email', $validated['email_professor'])->first();
                    if (! $teacher) {
                        throw ValidationException::withMessages(['email_professor' => 'Professor nao encontrado.']);
                    }
                    $teacherId = $teacher->id;
                }

                $class = ConnectClass::query()->updateOrCreate(
                    ['code' => $validated['codigo']],
                    [
                        'name' => $validated['nome'],
                        'connect_course_id' => $courseId,
                        'connect_teacher_id' => $teacherId,
                        'shift' => $validated['turno'] ?? null,
                        'start_date' => $validated['data_inicio'] ?? null,
                        'end_date' => $validated['data_fim'] ?? null,
                        'capacity' => $validated['capacidade'] ?? null,
                        'default_lessons_per_day' => $validated['aulas_por_dia'] ?? 4,
                        'status' => $validated['status'] ?? 'active',
                    ],
                );

                $class->wasRecentlyCreated ? $stats['created']++ : $stats['updated']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importContracts(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'matricula_aluno' => ['required', 'string', 'max:50'],
                    'tipo_contrato' => ['required', Rule::in(['estagio', 'aprendizagem', 'clt', 'temporario'])],
                    'data_inicio' => ['required', 'date'],
                    'data_fim' => ['nullable', 'date'],
                    'valor_mensal' => ['nullable', 'numeric', 'min:0'],
                    'empresa' => ['nullable', 'string', 'max:255'],
                    'status' => ['nullable', Rule::in(['active', 'inactive', 'finished'])],
                ])->validate();

                $student = ConnectStudent::query()
                    ->where('registration_number', $validated['matricula_aluno'])
                    ->first();

                if (! $student) {
                    throw ValidationException::withMessages(['matricula_aluno' => 'Aluno nao encontrado.']);
                }

                $contract = ConnectContract::query()->updateOrCreate(
                    [
                        'connect_student_id' => $student->id,
                        'contract_type' => $validated['tipo_contrato'],
                        'start_date' => $validated['data_inicio'],
                    ],
                    [
                        'end_date' => $validated['data_fim'] ?? null,
                        'monthly_value' => $validated['valor_mensal'] ?? 0,
                        'company_name' => $validated['empresa'] ?? null,
                        'status' => $validated['status'] ?? 'active',
                    ],
                );

                $contract->wasRecentlyCreated ? $stats['created']++ : $stats['updated']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function importAttendance(array $rows): array
    {
        $stats = ['created' => 0, 'updated' => 0, 'errors' => []];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            try {
                $validated = validator($row, [
                    'codigo_turma' => ['required', 'string', 'max:50'],
                    'data_sessao' => ['required', 'date'],
                    'disciplina' => ['nullable', 'string', 'max:255'],
                    'matricula_aluno' => ['required', 'string', 'max:50'],
                    'situacao' => ['nullable', Rule::in(['present', 'justified', 'absent', 'late'])],
                    'aulas_faltadas' => ['nullable', 'integer', 'min:0', 'max:5'],
                ])->validate();

                $class = ConnectClass::query()->where('code', $validated['codigo_turma'])->first();
                if (! $class) {
                    throw ValidationException::withMessages(['codigo_turma' => 'Turma nao encontrada.']);
                }

                $student = ConnectStudent::query()
                    ->where('registration_number', $validated['matricula_aluno'])
                    ->where('connect_class_id', $class->id)
                    ->first();

                if (! $student) {
                    throw ValidationException::withMessages(['matricula_aluno' => 'Aluno nao pertence a turma informada.']);
                }

                $sessionDate = Carbon::parse($validated['data_sessao'])->toDateString();
                $subject = $validated['disciplina'] ?? 'Aula regular';

                $session = ConnectAttendanceSession::query()
                    ->where('connect_class_id', $class->id)
                    ->whereDate('session_date', $sessionDate)
                    ->where('subject', $subject)
                    ->first();

                if (! $session) {
                    $session = ConnectAttendanceSession::query()->create([
                        'connect_class_id' => $class->id,
                        'session_date' => $sessionDate,
                        'subject' => $subject,
                        'connect_teacher_id' => $class->connect_teacher_id,
                        'lessons_count' => $class->default_lessons_per_day ?? 4,
                        'status' => 'open',
                    ]);
                }

                $status = $validated['situacao'] ?? 'present';
                $missed = (int) ($validated['aulas_faltadas'] ?? ($status === 'absent' ? $session->lessons_count : 0));

                $mark = ConnectAttendanceMark::query()->updateOrCreate(
                    [
                        'connect_attendance_session_id' => $session->id,
                        'connect_student_id' => $student->id,
                    ],
                    [
                        'status' => $status,
                        'missed_lessons' => min($missed, $session->lessons_count ?? 5),
                    ],
                );

                $mark->wasRecentlyCreated ? $stats['created']++ : $stats['updated']++;
            } catch (ValidationException $e) {
                $stats['errors'][] = ['row' => $line, 'message' => collect($e->errors())->flatten()->first() ?? 'Dados invalidos.'];
            } catch (\Throwable $e) {
                $stats['errors'][] = ['row' => $line, 'message' => $e->getMessage()];
            }
        }

        return $stats;
    }
}
