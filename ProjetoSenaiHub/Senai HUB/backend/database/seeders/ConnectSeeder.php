<?php

namespace Database\Seeders;

use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectAlert;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectDashboardMetric;
use App\Models\Connect\ConnectSalaryRecord;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectStudentLocation;
use App\Models\Connect\ConnectTeacher;
use App\Models\HubPerson;
use App\Models\User;
use App\Services\Connect\ConnectEnrollmentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ConnectSeeder extends Seeder
{
    public function run(): void
    {
        $carlosUser = User::query()->where('email', 'carlos.professor@senai.local')->first();
        $mariaUser = User::query()->where('email', 'maria.aluno@senai.local')->first();

        $courses = collect([
            [
                'code' => 'AUT',
                'name' => 'Automação Industrial',
                'description' => 'Formação em automação, CLPs e sistemas industriais integrados.',
                'workload_hours' => 1200,
                'area' => 'Indústria 4.0',
            ],
            [
                'code' => 'ELE',
                'name' => 'Eletrotécnica',
                'description' => 'Instalações elétricas, manutenção e projetos de baixa e média tensão.',
                'workload_hours' => 1000,
                'area' => 'Elétrica',
            ],
            [
                'code' => 'MEC',
                'name' => 'Mecânica Industrial',
                'description' => 'Usinagem, manutenção mecânica e processos de fabricação.',
                'workload_hours' => 1100,
                'area' => 'Mecânica',
            ],
            [
                'code' => 'INF',
                'name' => 'Informática Industrial',
                'description' => 'Redes, sistemas e integração de dados em ambientes fabris.',
                'workload_hours' => 900,
                'area' => 'Tecnologia',
            ],
            [
                'code' => 'LOG',
                'name' => 'Logística',
                'description' => 'Gestão de cadeia de suprimentos, estoque e transporte.',
                'workload_hours' => 800,
                'area' => 'Gestão',
            ],
        ])->map(fn (array $course) => ConnectCourse::query()->updateOrCreate(
            ['code' => $course['code']],
            [...$course, 'status' => 'active'],
        ));

        $teachers = collect([
            [
                'full_name' => 'Beatriz Alves Ferreira',
                'cpf' => '123.456.789-01',
                'email' => 'beatriz.ferreira@senai.local',
                'phone' => '(11) 98765-4321',
                'specialty' => 'Automação Industrial',
                'user_id' => $carlosUser?->id,
            ],
            [
                'full_name' => 'Carlos Professor',
                'cpf' => '234.567.890-12',
                'email' => 'carlos.professor@senai.local',
                'phone' => '(11) 97654-3210',
                'specialty' => 'Eletrotécnica',
                'user_id' => $carlosUser?->id,
            ],
            [
                'full_name' => 'Fernanda Rocha Lima',
                'cpf' => '345.678.901-23',
                'email' => 'fernanda.lima@senai.local',
                'phone' => '(11) 96543-2109',
                'specialty' => 'Mecânica Industrial',
            ],
            [
                'full_name' => 'Ricardo Mendes Souza',
                'cpf' => '456.789.012-34',
                'email' => 'ricardo.souza@senai.local',
                'phone' => '(11) 95432-1098',
                'specialty' => 'Informática Industrial',
            ],
        ])->map(fn (array $teacher) => ConnectTeacher::query()->updateOrCreate(
            ['email' => $teacher['email']],
            [...$teacher, 'status' => 'active'],
        ));

        $classes = collect([
            [
                'connect_course_id' => $courses[0]->id,
                'connect_teacher_id' => $teachers[0]->id,
                'code' => 'TURMA AUT25-02',
                'name' => 'Turma Automação 2025 - 2º Semestre',
                'shift' => 'noite',
                'start_date' => '2025-02-01',
                'end_date' => '2025-12-15',
                'capacity' => 35,
            ],
            [
                'connect_course_id' => $courses[1]->id,
                'connect_teacher_id' => $teachers[1]->id,
                'code' => 'TURMA ELE25-01',
                'name' => 'Turma Eletrotécnica 2025 - 1º Semestre',
                'shift' => 'tarde',
                'start_date' => '2025-01-15',
                'end_date' => '2025-11-30',
                'capacity' => 30,
            ],
            [
                'connect_course_id' => $courses[2]->id,
                'connect_teacher_id' => $teachers[2]->id,
                'code' => 'TURMA MEC25-03',
                'name' => 'Turma Mecânica 2025 - Turno Manhã',
                'shift' => 'manha',
                'start_date' => '2025-03-01',
                'end_date' => '2025-12-20',
                'capacity' => 28,
            ],
            [
                'connect_course_id' => $courses[3]->id,
                'connect_teacher_id' => $teachers[3]->id,
                'code' => 'TURMA INF25-01',
                'name' => 'Turma Informática Industrial 2025',
                'shift' => 'noite',
                'start_date' => '2025-02-10',
                'end_date' => '2025-12-10',
                'capacity' => 32,
            ],
            [
                'connect_course_id' => $courses[4]->id,
                'connect_teacher_id' => $teachers[0]->id,
                'code' => 'TURMA LOG25-01',
                'name' => 'Turma Logística 2025 - Integrado',
                'shift' => 'tarde',
                'start_date' => '2025-02-15',
                'end_date' => '2025-12-01',
                'capacity' => 30,
            ],
        ])->map(fn (array $class) => ConnectClass::query()->updateOrCreate(
            ['code' => $class['code']],
            [...$class, 'status' => 'active'],
        ));

        $mainClass = $classes[0];

        $studentNames = [
            ['full_name' => 'João Paulo Vieira', 'email' => 'joao.vieira@aluno.senai.local', 'registration_number' => '2025AUT0021'],
            ['full_name' => 'Maria Silva', 'email' => 'maria.aluno@senai.local', 'registration_number' => '2025AUT0003', 'user_id' => $mariaUser?->id],
            ['full_name' => 'Ana Carolina Souza', 'email' => 'ana.carolina@aluno.senai.local', 'registration_number' => '2025AUT0015'],
            ['full_name' => 'Pedro Henrique Santos', 'email' => 'pedro.santos@aluno.senai.local', 'registration_number' => '2025AUT0018'],
            ['full_name' => 'Juliana Martins Costa', 'email' => 'juliana.costa@aluno.senai.local', 'registration_number' => '2025AUT0022'],
            ['full_name' => 'Lucas Oliveira Pereira', 'email' => 'lucas.pereira@aluno.senai.local', 'registration_number' => '2025AUT0025'],
            ['full_name' => 'Camila Rodrigues Alves', 'email' => 'camila.alves@aluno.senai.local', 'registration_number' => '2025AUT0028'],
            ['full_name' => 'Rafael Gomes Nunes', 'email' => 'rafael.nunes@aluno.senai.local', 'registration_number' => '2025AUT0031'],
            ['full_name' => 'Bruna Ferreira Lima', 'email' => 'bruna.lima@aluno.senai.local', 'registration_number' => '2025AUT0034'],
            ['full_name' => 'Gabriel Dias Rocha', 'email' => 'gabriel.rocha@aluno.senai.local', 'registration_number' => '2025AUT0037'],
            ['full_name' => 'Larissa Araújo Melo', 'email' => 'larissa.melo@aluno.senai.local', 'registration_number' => '2025ELE0008'],
            ['full_name' => 'Thiago Barbosa Cardoso', 'email' => 'thiago.cardoso@aluno.senai.local', 'registration_number' => '2025ELE0011'],
            ['full_name' => 'Patrícia Nascimento Duarte', 'email' => 'patricia.duarte@aluno.senai.local', 'registration_number' => '2025ELE0014'],
            ['full_name' => 'Felipe Correia Moura', 'email' => 'felipe.moura@aluno.senai.local', 'registration_number' => '2025MEC0005'],
            ['full_name' => 'Isabela Cavalcanti Ribeiro', 'email' => 'isabela.ribeiro@aluno.senai.local', 'registration_number' => '2025MEC0009'],
            ['full_name' => 'Matheus Pinto Freitas', 'email' => 'matheus.freitas@aluno.senai.local', 'registration_number' => '2025MEC0012'],
            ['full_name' => 'Amanda Teixeira Borges', 'email' => 'amanda.borges@aluno.senai.local', 'registration_number' => '2025INF0004'],
            ['full_name' => 'Diego Monteiro Farias', 'email' => 'diego.farias@aluno.senai.local', 'registration_number' => '2025INF0007'],
            ['full_name' => 'Renata Cunha Barros', 'email' => 'renata.barros@aluno.senai.local', 'registration_number' => '2025INF0010'],
            ['full_name' => 'Vinícius Lopes Andrade', 'email' => 'vinicius.andrade@aluno.senai.local', 'registration_number' => '2025AUT0040'],
            ['full_name' => 'Helena Moura Pires', 'email' => 'helena.pires@aluno.senai.local', 'registration_number' => '2025AUT0043'],
            ['full_name' => 'Eduardo Sampaio Reis', 'email' => 'eduardo.reis@aluno.senai.local', 'registration_number' => '2025ELE0017'],
            ['full_name' => 'Carolina Vieira Nogueira', 'email' => 'carolina.nogueira@aluno.senai.local', 'registration_number' => '2025MEC0015'],
            ['full_name' => 'Gustavo Peixoto Ramos', 'email' => 'gustavo.ramos@aluno.senai.local', 'registration_number' => '2025INF0013'],
            ['full_name' => 'Mariana Duarte Coelho', 'email' => 'mariana.coelho@aluno.senai.local', 'registration_number' => '2025AUT0046'],
            ['full_name' => 'Rodrigo Almeida Castro', 'email' => 'rodrigo.castro@aluno.senai.local', 'registration_number' => '2025ELE0020'],
            ['full_name' => 'Bianca Souza Machado', 'email' => 'bianca.machado@aluno.senai.local', 'registration_number' => '2025MEC0018'],
            ['full_name' => 'André Luiz Figueiredo', 'email' => 'andre.figueiredo@aluno.senai.local', 'registration_number' => '2025INF0016'],
        ];

        $studentNames = array_merge($studentNames, $this->generateExtraStudents($classes));

        $students = collect($studentNames)->map(function (array $student, int $index) use ($classes, $mainClass) {
            $class = match (true) {
                str_contains($student['registration_number'], 'ELE') => $classes[1],
                str_contains($student['registration_number'], 'MEC') => $classes[2],
                str_contains($student['registration_number'], 'INF') => $classes[3],
                str_contains($student['registration_number'], 'LOG') => $classes[4],
                default => $mainClass,
            };

            $createdAt = $index < 12
                ? now()->subDays($index % 20)
                : now()->subMonths(1 + ($index % 4))->subDays($index % 28);

            return ConnectStudent::query()->updateOrCreate(
                ['registration_number' => $student['registration_number']],
                [
                    'connect_class_id' => $class->id,
                    'full_name' => $student['full_name'],
                    'cpf' => sprintf('%03d.%03d.%03d-%02d', ($index + 100) % 1000, ($index + 200) % 1000, ($index + 300) % 1000, ($index + 10) % 100),
                    'email' => $student['email'],
                    'phone' => sprintf('(11) 9%04d-%04d', 8000 + $index, 1000 + $index),
                    'birth_date' => Carbon::now()->subYears(18 + ($index % 8))->subMonths($index % 12)->format('Y-m-d'),
                    'status' => 'active',
                    'user_id' => $student['user_id'] ?? null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ],
            );
        });

        $this->seedAttendanceSessions($classes, $students);

        $locations = [
            ['city' => 'São Paulo', 'state' => 'SP', 'lat' => -23.5505, 'lng' => -46.6333, 'status' => 'online'],
            ['city' => 'Guarulhos', 'state' => 'SP', 'lat' => -23.4628, 'lng' => -46.5333, 'status' => 'online'],
            ['city' => 'Osasco', 'state' => 'SP', 'lat' => -23.5329, 'lng' => -46.7919, 'status' => 'offline'],
            ['city' => 'Santo André', 'state' => 'SP', 'lat' => -23.6636, 'lng' => -46.5382, 'status' => 'online'],
            ['city' => 'São Bernardo', 'state' => 'SP', 'lat' => -23.6914, 'lng' => -46.5646, 'status' => 'offline'],
            ['city' => 'Diadema', 'state' => 'SP', 'lat' => -23.6861, 'lng' => -46.6228, 'status' => 'unknown'],
        ];

        foreach ($students->take(24) as $index => $student) {
            $location = $locations[$index % count($locations)];

            ConnectStudentLocation::query()->updateOrCreate(
                ['connect_student_id' => $student->id],
                [
                    'latitude' => $location['lat'] + ($index * 0.001),
                    'longitude' => $location['lng'] - ($index * 0.001),
                    'address' => "Rua {$index} de Maio, {$index}00",
                    'city' => $location['city'],
                    'state' => $location['state'],
                    'last_seen_at' => $location['status'] === 'online' ? now()->subMinutes(5 + $index) : now()->subHours(6 + $index),
                    'status' => $location['status'],
                ],
            );
        }

        foreach ($students->take(18) as $index => $student) {
            ConnectContract::query()->updateOrCreate(
                [
                    'connect_student_id' => $student->id,
                    'contract_type' => 'estagio',
                    'start_date' => '2025-01-01',
                ],
                [
                    'end_date' => '2025-12-31',
                    'monthly_value' => 1200 + ($index * 50),
                    'company_name' => ['Indústria Metalúrgica ABC', 'TechAutomation Ltda', 'EletroFábrica SP', 'Mecânica Precision'][$index % 4],
                    'status' => 'active',
                ],
            );
        }

        foreach ($students->take(14) as $index => $student) {
            ConnectSalaryRecord::query()->updateOrCreate(
                [
                    'connect_student_id' => $student->id,
                    'reference_month' => now()->startOfMonth()->subMonths($index % 3),
                ],
                [
                    'base_amount' => 1200 + ($index * 50),
                    'deductions' => 120,
                    'bonuses' => $index % 2 === 0 ? 150 : 0,
                    'net_amount' => 1200 + ($index * 50) - 120 + ($index % 2 === 0 ? 150 : 0),
                    'status' => 'calculated',
                    'calculated_at' => now()->subDays($index),
                ],
            );
        }

        $activities = [
            [
                'title' => 'Cadastro de aluno',
                'description' => 'João Paulo Vieira matriculado na turma TURMA AUT25-02.',
                'type' => 'cadastro',
                'entity_type' => 'student',
                'performed_by' => 'Ana Souza',
                'occurred_at' => now()->subHours(2),
            ],
            [
                'title' => 'Frequência registrada',
                'description' => 'Chamada da turma TURMA AUT25-02 concluída por Beatriz Alves Ferreira.',
                'type' => 'attendance',
                'entity_type' => 'class',
                'performed_by' => 'Beatriz Alves Ferreira',
                'occurred_at' => now()->subHours(5),
            ],
            [
                'title' => 'Contrato de estágio',
                'description' => 'Novo contrato cadastrado para Maria Silva na TechAutomation Ltda.',
                'type' => 'contract',
                'entity_type' => 'contract',
                'performed_by' => 'Ana Souza',
                'occurred_at' => now()->subDay(),
            ],
            [
                'title' => 'Curso atualizado',
                'description' => 'Carga horária do curso Automação Industrial revisada.',
                'type' => 'update',
                'entity_type' => 'course',
                'performed_by' => 'Administrador SENAI',
                'occurred_at' => now()->subDays(2),
            ],
            [
                'title' => 'Bolsa calculada',
                'description' => 'Remuneração de maio calculada para 6 alunos com contrato ativo.',
                'type' => 'salary',
                'entity_type' => 'salary',
                'performed_by' => 'Ana Souza',
                'occurred_at' => now()->subDays(3),
            ],
        ];

        foreach ($activities as $activity) {
            ConnectActivity::query()->updateOrCreate(
                ['title' => $activity['title'], 'occurred_at' => $activity['occurred_at']],
                $activity,
            );
        }

        $this->seedExtraActivities($classes, $students);

        $alerts = [
            [
                'title' => 'Documentação pendente',
                'message' => '3 alunos da turma TURMA AUT25-02 com documentos de matrícula incompletos.',
                'type' => 'warning',
                'category' => 'cadastro',
            ],
            [
                'title' => 'Contrato próximo do vencimento',
                'message' => 'Contrato de estágio de Pedro Henrique Santos vence em 15 dias.',
                'type' => 'info',
                'category' => 'contrato',
            ],
            [
                'title' => 'Baixa frequência',
                'message' => 'Turma TURMA ELE25-01 com frequência abaixo de 75% na última semana.',
                'type' => 'danger',
                'category' => 'frequencia',
            ],
            [
                'title' => 'Novo cadastro',
                'message' => 'Aluno João Paulo Vieira aguardando validação de documentos.',
                'type' => 'info',
                'category' => 'cadastro',
            ],
        ];

        foreach ($alerts as $alert) {
            ConnectAlert::query()->updateOrCreate(
                ['title' => $alert['title']],
                [...$alert, 'is_read' => false],
            );
        }

        $this->seedStaffPeople();

        $studentTotal = ConnectStudent::query()->where('status', 'active')->count();

        ConnectDashboardMetric::query()->updateOrCreate(
            ['key' => 'kpis'],
            ['value' => ['total_students' => $studentTotal]],
        );

        ConnectDashboardMetric::query()->updateOrCreate(
            ['key' => 'attendance_chart'],
            [
                'value' => [
                    'labels' => ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    'datasets' => [
                        [
                            'label' => 'Frequência (%)',
                            'data' => [82, 85, 88, 86, 89, 87],
                        ],
                        [
                            'label' => 'Matrículas',
                            'data' => [210, 245, 198, 267, 231, 289],
                        ],
                    ],
                ],
            ],
        );

        $this->ensureHubPeopleAndRosterLinks();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ConnectClass>  $classes
     * @return list<array{full_name: string, email: string, registration_number: string}>
     */
    private function generateExtraStudents(\Illuminate\Support\Collection $classes): array
    {
        $firstNames = [
            'Alexandre', 'Beatriz', 'César', 'Daniela', 'Enzo', 'Fabiana', 'Guilherme', 'Heloísa',
            'Igor', 'Jéssica', 'Kauã', 'Letícia', 'Marcelo', 'Natália', 'Otávio', 'Paula',
            'Quésia', 'Ronaldo', 'Sabrina', 'Tatiane', 'Ulisses', 'Valéria', 'Wesley', 'Yasmin', 'Zeca',
        ];
        $lastNames = [
            'Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Fonseca', 'Gonçalves', 'Henrique',
            'Ibrahim', 'Junqueira', 'Klein', 'Lacerda', 'Macedo', 'Nery', 'Oliveira', 'Prado',
        ];

        $prefixByClass = [
            0 => 'AUT',
            1 => 'ELE',
            2 => 'MEC',
            3 => 'INF',
            4 => 'LOG',
        ];

        $extra = [];
        $seq = 50;

        foreach ($prefixByClass as $classIndex => $prefix) {
            if (! isset($classes[$classIndex])) {
                continue;
            }

            for ($i = 0; $i < 10; $i++) {
                $first = $firstNames[($classIndex * 3 + $i) % count($firstNames)];
                $last = $lastNames[($seq + $i) % count($lastNames)];
                $fullName = "{$first} {$last}";
                $slug = strtolower(str_replace([' ', 'á', 'é', 'í', 'ó', 'ú', 'ã', 'õ', 'ç'], ['', 'a', 'e', 'i', 'o', 'u', 'a', 'o', 'c'], $first.'.'.$last));

                $extra[] = [
                    'full_name' => $fullName,
                    'email' => "{$slug}.{$seq}@aluno.senai.local",
                    'registration_number' => sprintf('2025%s%04d', $prefix, $seq),
                ];
                $seq++;
            }
        }

        return $extra;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ConnectClass>  $classes
     * @param  \Illuminate\Support\Collection<int, ConnectStudent>  $students
     */
    private function seedAttendanceSessions(\Illuminate\Support\Collection $classes, \Illuminate\Support\Collection $students): void
    {
        $subjects = [
            'Automação de Processos',
            'Instalações Elétricas',
            'Usinagem CNC',
            'Redes Industriais',
            'Gestão de Estoques',
            'Segurança do Trabalho',
        ];

        $statuses = ['present', 'present', 'present', 'late', 'absent', 'justified'];

        foreach ($classes as $classIndex => $class) {
            for ($day = 0; $day < 7; $day++) {
                $sessionDate = now()->subDays($day)->toDateString();
                $subject = $subjects[$classIndex % count($subjects)].' · '.$class->code;

                $session = ConnectAttendanceSession::query()
                    ->where('connect_class_id', $class->id)
                    ->whereDate('session_date', $sessionDate)
                    ->where('subject', $subject)
                    ->first();

                if ($session === null) {
                    $session = ConnectAttendanceSession::query()->create([
                        'connect_class_id' => $class->id,
                        'session_date' => $sessionDate,
                        'subject' => $subject,
                        'connect_teacher_id' => $class->connect_teacher_id,
                        'status' => $day === 0 ? 'open' : 'closed',
                    ]);
                } else {
                    $session->update([
                        'connect_teacher_id' => $class->connect_teacher_id,
                        'status' => $day === 0 ? 'open' : 'closed',
                    ]);
                }

                $classStudents = $students->filter(
                    fn (ConnectStudent $student) => $student->connect_class_id === $class->id,
                );

                foreach ($classStudents as $studentIndex => $student) {
                    ConnectAttendanceMark::query()->updateOrCreate(
                        [
                            'connect_attendance_session_id' => $session->id,
                            'connect_student_id' => $student->id,
                        ],
                        [
                            'status' => $statuses[($studentIndex + $day + $classIndex) % count($statuses)],
                            'notes' => null,
                        ],
                    );
                }
            }
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ConnectClass>  $classes
     * @param  \Illuminate\Support\Collection<int, ConnectStudent>  $students
     */
    private function seedExtraActivities(\Illuminate\Support\Collection $classes, \Illuminate\Support\Collection $students): void
    {
        $samples = [
            [
                'title' => 'Turma criada',
                'description' => 'Nova turma '.$classes->last()?->code.' disponível para matrículas.',
                'type' => 'cadastro',
                'entity_type' => 'class',
                'performed_by' => 'Administrador SENAI',
                'occurred_at' => now()->subHours(8),
            ],
            [
                'title' => 'Matrícula em lote',
                'description' => $students->count().' alunos ativos no Connect após sincronização.',
                'type' => 'cadastro',
                'entity_type' => 'student',
                'performed_by' => 'Sistema',
                'occurred_at' => now()->subHours(12),
            ],
            [
                'title' => 'Chamada semanal',
                'description' => 'Frequência registrada em '.$classes->count().' turmas nos últimos 7 dias.',
                'type' => 'attendance',
                'entity_type' => 'class',
                'performed_by' => 'Beatriz Alves Ferreira',
                'occurred_at' => now()->subHours(18),
            ],
        ];

        foreach ($samples as $activity) {
            ConnectActivity::query()->updateOrCreate(
                ['title' => $activity['title']],
                $activity,
            );
        }
    }

    private function seedStaffPeople(): void
    {
        $staff = [
            [
                'kind' => 'staff',
                'full_name' => 'Ana Souza',
                'email' => 'ana.grid@senai.local',
                'phone' => '(11) 98888-1001',
                'specialty' => 'Secretaria acadêmica',
                'registration_number' => 'FUNC-0001',
            ],
            [
                'kind' => 'staff',
                'full_name' => 'Roberto Nunes',
                'email' => 'roberto.nunes@senai.local',
                'phone' => '(11) 98888-1002',
                'specialty' => 'Coordenação pedagógica',
                'registration_number' => 'FUNC-0002',
            ],
            [
                'kind' => 'staff',
                'full_name' => 'Cláudia Mendes',
                'email' => 'claudia.mendes@senai.local',
                'phone' => '(11) 98888-1003',
                'specialty' => 'RH / Estágios',
                'registration_number' => 'FUNC-0003',
            ],
            [
                'kind' => 'other',
                'full_name' => 'Parceiro Indústria ABC',
                'email' => 'contato@industriaabc.com.br',
                'phone' => '(11) 4000-2000',
                'specialty' => 'Empresa conveniada',
                'registration_number' => 'EXT-0001',
            ],
        ];

        foreach ($staff as $person) {
            HubPerson::query()->updateOrCreate(
                ['email' => $person['email']],
                [...$person, 'status' => 'active'],
            );
        }
    }

    private function ensureHubPeopleAndRosterLinks(): void
    {
        foreach (ConnectTeacher::query()->whereNull('hub_person_id')->cursor() as $teacher) {
            $person = HubPerson::query()->create([
                'kind' => 'teacher',
                'user_id' => $teacher->user_id,
                'full_name' => $teacher->full_name,
                'cpf' => $teacher->cpf,
                'registration_number' => null,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'birth_date' => null,
                'specialty' => $teacher->specialty,
                'status' => $teacher->status,
            ]);
            $teacher->forceFill(['hub_person_id' => $person->id])->save();
        }

        foreach (ConnectStudent::query()->whereNull('hub_person_id')->cursor() as $student) {
            $person = HubPerson::query()->create([
                'kind' => 'student',
                'user_id' => $student->user_id,
                'full_name' => $student->full_name,
                'cpf' => $student->cpf,
                'registration_number' => $student->registration_number,
                'email' => $student->email,
                'phone' => $student->phone,
                'birth_date' => $student->birth_date,
                'specialty' => null,
                'status' => $student->status,
            ]);
            $student->forceFill(['hub_person_id' => $person->id])->save();
        }

        $enrollment = app(ConnectEnrollmentService::class);

        foreach (ConnectStudent::query()->with('hubPerson')->cursor() as $student) {
            if ($student->hubPerson) {
                $enrollment->syncPivotsForStudent($student);
            }
        }

        foreach (ConnectClass::query()->cursor() as $class) {
            $enrollment->syncTeacherCourseFromClass($class);
        }
    }
}
