<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\Grid\GridUser;
use App\Models\HubPerson;
use App\Models\User;
use App\Support\Spreadsheet\SpreadsheetFileParser;
use App\Support\Spreadsheet\SpreadsheetRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SpreadsheetImportExportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->first();
        $this->assertNotNull($user);

        return $user;
    }

    /**
     * @return list<array{0: string, 1: string, 2: string, 3?: int, 4?: int}>
     */
    public static function importableSpreadsheets(): array
    {
        $cases = [];

        foreach (SpreadsheetRegistry::modules() as $module => $definitions) {
            foreach ($definitions as $key => $definition) {
                if (! ($definition['importable'] ?? true)) {
                    continue;
                }

                $cases[] = [$module, $key, self::sampleCsv($module, $key)];
            }
        }

        return $cases;
    }

    private static function sampleCsv(string $module, string $key): string
    {
        return match ("{$module}:{$key}") {
            'connect:people' => "tipo;nome_completo;cpf;email;telefone;matricula;data_nascimento;especialidade;status\n"
                . "student;Pessoa Import;111.222.333-99;pessoa.import@senai.local;(11) 91111-0001;2026IMP0001;2006-01-15;;active\n",
            'connect:students' => "matricula;nome_completo;cpf;email;telefone;data_nascimento;status;codigo_turma\n"
                . "2026IMP0002;Aluno Import;222.333.444-55;aluno.import@senai.local;(11) 92222-0002;2007-03-20;active;TURMA AUT25-02\n",
            'connect:teachers' => "nome_completo;cpf;email;telefone;especialidade;status\n"
                . "Professor Import;333.444.555-66;prof.import@senai.local;(11) 93333-0003;Automacao;active\n",
            'connect:courses' => "codigo;nome;descricao;carga_horaria;area;status\n"
                . "IMP-CUR;Curso Importado;Descricao teste;800;Industrial;active\n",
            'connect:classes' => "codigo;nome;codigo_curso;email_professor;turno;data_inicio;data_fim;capacidade;aulas_por_dia;status\n"
                . "TURMA-IMP-01;Turma Import;AUT;carlos.professor@senai.local;noite;2026-02-01;2026-12-15;25;4;active\n",
            'connect:contracts' => "matricula_aluno;tipo_contrato;data_inicio;data_fim;valor_mensal;empresa;status\n"
                . "2025AUT0003;estagio;2026-01-01;2026-12-31;1500;Empresa Import;active\n",
            'connect:attendance' => "codigo_turma;data_sessao;disciplina;matricula_aluno;situacao;aulas_faltadas\n"
                . "TURMA AUT25-02;2026-06-14;Aula import;2025AUT0003;present;0\n",
            'grid:users' => "nome;email;telefone;perfil;cpf;status\n"
                . "Tecnico Import;import-test@grid.senai.local;(11) 90000-0001;Tecnico de manutencao;;active\n",
            'grid:inventory' => "titulo;categoria;qtd_disponivel;qtd_minima;local;fornecedor;custo;status\n"
                . "Item Importado Teste;Ferragens;50;5;Almox A;Fornecedor X;3.50;disponivel\n",
            'grid:tickets' => "titulo;solicitante;resumo;sala;bloco;prioridade\n"
                . "Chamado Importado;Coordenacao;Resumo teste;15;A;media\n",
            'grid:tasks' => "codigo_chamado;titulo;responsavel;coluna;prioridade;sala;bloco\n"
                . "#CH-2026-S01;Tarefa Importada;Julio Oliveira;a_fazer;media;101;A\n",
            default => throw new \InvalidArgumentException("Missing sample CSV for {$module}:{$key}"),
        };
    }

    #[DataProvider('importableSpreadsheets')]
    public function test_each_importable_spreadsheet_accepts_valid_csv(string $module, string $key, string $csv): void
    {
        $user = $this->admin();
        $this->actingAs($user);

        $file = UploadedFile::fake()->createWithContent("{$key}.csv", $csv);

        $this->postJson("/api/spreadsheets/{$module}/{$key}/preview", ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.total_rows', 1)
            ->assertJsonPath('data.errors', []);

        $beforeCounts = $this->entityCounts($module, $key);

        $this->postJson("/api/spreadsheets/{$module}/{$key}/import", ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.errors', []);

        $afterCounts = $this->entityCounts($module, $key);
        $this->assertTrue(
            $this->countsIncreased($module, $key, $beforeCounts, $afterCounts),
            "Import for {$module}/{$key} did not persist expected records.",
        );
    }

    /**
     * @return array<string, int>
     */
    private function entityCounts(string $module, string $key): array
    {
        return match ("{$module}:{$key}") {
            'connect:people' => ['people' => HubPerson::query()->count()],
            'connect:students' => ['students' => ConnectStudent::query()->where('registration_number', '2026IMP0002')->count()],
            'connect:teachers' => ['teachers' => \App\Models\Connect\ConnectTeacher::query()->where('email', 'prof.import@senai.local')->count()],
            'connect:courses' => ['courses' => ConnectCourse::query()->where('code', 'IMP-CUR')->count()],
            'connect:classes' => ['classes' => \App\Models\Connect\ConnectClass::query()->where('code', 'TURMA-IMP-01')->count()],
            'connect:contracts' => ['contracts' => \App\Models\Connect\ConnectContract::query()->count()],
            'connect:attendance' => [
                'sessions' => ConnectAttendanceSession::query()->count(),
                'marks' => \App\Models\Connect\ConnectAttendanceMark::query()->count(),
            ],
            'grid:users' => ['users' => GridUser::query()->where('email', 'import-test@grid.senai.local')->count()],
            'grid:inventory' => ['inventory' => GridInventoryItem::query()->where('title', 'Item Importado Teste')->count()],
            'grid:tickets' => ['tickets' => GridTicket::query()->where('title', 'Chamado Importado')->count()],
            'grid:tasks' => ['tasks' => GridTask::query()->where('title', 'Tarefa Importada')->count()],
            default => [],
        };
    }

    /**
     * @param  array<string, int>  $before
     * @param  array<string, int>  $after
     */
    private function countsIncreased(string $module, string $key, array $before, array $after): bool
    {
        foreach ($before as $metric => $count) {
            if (($after[$metric] ?? 0) <= $count) {
                return false;
            }
        }

        return $before !== [];
    }

    public function test_grid_template_export_and_csv_import_preview(): void
    {
        $user = $this->admin();
        $this->actingAs($user);

        $this->getJson('/api/spreadsheets/grid')
            ->assertOk()
            ->assertJsonPath('data.0.key', 'users');

        $this->get('/api/spreadsheets/grid/users/template')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $this->get('/api/spreadsheets/grid/users/export')
            ->assertOk();

        $csv = self::sampleCsv('grid', 'users');
        $file = UploadedFile::fake()->createWithContent('users.csv', $csv);

        $columns = SpreadsheetRegistry::columns('grid', 'users');
        $rows = SpreadsheetFileParser::parse($file, $columns);
        $this->assertCount(1, $rows);
        $this->assertSame('import-test@grid.senai.local', $rows[0]['email']);

        $this->postJson('/api/spreadsheets/grid/users/preview', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.total_rows', 1);

        $this->postJson('/api/spreadsheets/grid/users/import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.created', 1);

        $this->getJson('/api/spreadsheets/grid/import-logs')
            ->assertOk()
            ->assertJsonFragment(['spreadsheet_key' => 'users']);
    }

    public function test_csv_delimiter_semicolon_is_detected(): void
    {
        $columns = [
            ['key' => 'nome', 'header' => 'nome'],
            ['key' => 'email', 'header' => 'email'],
        ];

        $csv = "nome;email\nAna;ana@test.local\n";
        $file = UploadedFile::fake()->createWithContent('delim.csv', $csv);

        $rows = SpreadsheetFileParser::parse($file, $columns);

        $this->assertCount(1, $rows);
        $this->assertSame('ana@test.local', $rows[0]['email']);
    }

    public function test_export_only_spreadsheet_rejects_import(): void
    {
        $user = $this->admin();
        $this->actingAs($user);

        $csv = "codigo_turma;turma;data_sessao;disciplina;aulas_no_dia;status_sessao;total_alunos;presentes;faltas\n";
        $csv .= "TURMA AUT25-02;Turma;2026-06-14;Aula;4;open;1;1;0\n";
        $file = UploadedFile::fake()->createWithContent('sessions.csv', $csv);

        $this->postJson('/api/spreadsheets/connect/attendance_sessions/import', ['file' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_preview_does_not_persist_records(): void
    {
        $user = $this->admin();
        $this->actingAs($user);

        $before = GridTicket::query()->count();
        $csv = self::sampleCsv('grid', 'tickets');
        $file = UploadedFile::fake()->createWithContent('tickets.csv', $csv);

        $this->postJson('/api/spreadsheets/grid/tickets/preview', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.created', 1);

        $this->assertSame($before, GridTicket::query()->count());
    }

    public function test_connect_student_import_updates_existing_row(): void
    {
        $user = $this->admin();
        $this->actingAs($user);

        $csvCreate = self::sampleCsv('connect', 'students');
        $fileCreate = UploadedFile::fake()->createWithContent('students.csv', $csvCreate);

        $this->postJson('/api/spreadsheets/connect/students/import', ['file' => $fileCreate])
            ->assertOk()
            ->assertJsonPath('data.created', 1);

        $csvUpdate = str_replace('Aluno Import', 'Aluno Import Atualizado', $csvCreate);
        $fileUpdate = UploadedFile::fake()->createWithContent('students-update.csv', $csvUpdate);

        $this->postJson('/api/spreadsheets/connect/students/import', ['file' => $fileUpdate])
            ->assertOk()
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.created', 0);

        $this->assertSame(
            'Aluno Import Atualizado',
            ConnectStudent::query()->where('registration_number', '2026IMP0002')->value('full_name'),
        );
    }

    public function test_attendance_import_reuses_existing_session_for_same_date(): void
    {
        $user = $this->admin();
        $this->actingAs($user);

        $csv = self::sampleCsv('connect', 'attendance');
        $csv .= "TURMA AUT25-02;2026-06-14;Aula import;2025AUT0021;absent;2\n";
        $file = UploadedFile::fake()->createWithContent('attendance.csv', $csv);

        $sessionsBefore = ConnectAttendanceSession::query()->count();

        $this->postJson('/api/spreadsheets/connect/attendance/import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.errors', [])
            ->assertJsonPath('data.created', 2);

        $this->assertSame($sessionsBefore + 1, ConnectAttendanceSession::query()->count());
    }
}
