<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Spreadsheet\CsvStream;
use App\Support\Spreadsheet\SpreadsheetFileParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SpreadsheetImportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_grid_template_export_and_csv_import_preview(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@senaihub.local')->first();
        $this->assertNotNull($user);

        $this->actingAs($user);

        $this->getJson('/api/spreadsheets/grid')
            ->assertOk()
            ->assertJsonPath('data.0.key', 'users');

        $this->get('/api/spreadsheets/grid/users/template')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $this->get('/api/spreadsheets/grid/users/export')
            ->assertOk();

        $csv = "nome;email;telefone;perfil;cpf;status\n";
        $csv .= "Teste Import;import-test@grid.senai.local;(11) 90000-0001;Tecnico de manutencao;;active\n";

        $file = UploadedFile::fake()->createWithContent('users.csv', $csv);

        $columns = [
            ['key' => 'nome', 'header' => 'nome'],
            ['key' => 'email', 'header' => 'email'],
            ['key' => 'telefone', 'header' => 'telefone'],
            ['key' => 'perfil', 'header' => 'perfil'],
            ['key' => 'cpf', 'header' => 'cpf'],
            ['key' => 'status', 'header' => 'status'],
        ];

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
}
