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
use App\Models\User;
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

        $students = collect($studentNames)->map(function (array $student, int $index) use ($classes, $mainClass) {
            $class = match (true) {
                str_contains($student['registration_number'], 'ELE') => $classes[1],
                str_contains($student['registration_number'], 'MEC') => $classes[2],
                str_contains($student['registration_number'], 'INF') => $classes[3],
                default => $mainClass,
            };

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
                ],
            );
        });

        $sessionDates = [
            now()->subDays(2)->toDateString(),
            now()->subDays(1)->toDateString(),
            now()->toDateString(),
        ];

        foreach ($sessionDates as $dateIndex => $sessionDate) {
            $session = ConnectAttendanceSession::query()->updateOrCreate(
                [
                    'connect_class_id' => $mainClass->id,
                    'session_date' => $sessionDate,
                    'subject' => 'Automação de Processos',
                ],
                [
                    'connect_teacher_id' => $mainClass->connect_teacher_id,
                    'status' => $dateIndex < 2 ? 'closed' : 'open',
                ],
            );

            $mainClassStudents = $students->filter(
                fn (ConnectStudent $student) => $student->connect_class_id === $mainClass->id,
            );

            foreach ($mainClassStudents as $studentIndex => $student) {
                $statuses = ['present', 'present', 'present', 'late', 'absent', 'justified'];
                ConnectAttendanceMark::query()->updateOrCreate(
                    [
                        'connect_attendance_session_id' => $session->id,
                        'connect_student_id' => $student->id,
                    ],
                    [
                        'status' => $statuses[($studentIndex + $dateIndex) % count($statuses)],
                        'notes' => null,
                    ],
                );
            }
        }

        $locations = [
            ['city' => 'São Paulo', 'state' => 'SP', 'lat' => -23.5505, 'lng' => -46.6333, 'status' => 'online'],
            ['city' => 'Guarulhos', 'state' => 'SP', 'lat' => -23.4628, 'lng' => -46.5333, 'status' => 'online'],
            ['city' => 'Osasco', 'state' => 'SP', 'lat' => -23.5329, 'lng' => -46.7919, 'status' => 'offline'],
            ['city' => 'Santo André', 'state' => 'SP', 'lat' => -23.6636, 'lng' => -46.5382, 'status' => 'online'],
            ['city' => 'São Bernardo', 'state' => 'SP', 'lat' => -23.6914, 'lng' => -46.5646, 'status' => 'offline'],
            ['city' => 'Diadema', 'state' => 'SP', 'lat' => -23.6861, 'lng' => -46.6228, 'status' => 'unknown'],
        ];

        foreach ($students->take(12) as $index => $student) {
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

        foreach ($students->take(8) as $index => $student) {
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

        foreach ($students->take(6) as $index => $student) {
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
            ConnectActivity::query()->create($activity);
        }

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
            ConnectAlert::query()->create([
                ...$alert,
                'is_read' => false,
            ]);
        }

        ConnectDashboardMetric::query()->updateOrCreate(
            ['key' => 'kpis'],
            ['value' => ['total_students' => 2489]],
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
    }
}
