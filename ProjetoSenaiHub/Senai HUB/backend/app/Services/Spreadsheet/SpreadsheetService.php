<?php

namespace App\Services\Spreadsheet;

use App\Models\SpreadsheetImportLog;
use App\Models\User;
use App\Support\Spreadsheet\CsvStream;
use App\Support\Spreadsheet\SpreadsheetFileParser;
use App\Support\Spreadsheet\SpreadsheetRegistry;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpreadsheetService
{
    public function __construct(
        private readonly ConnectSpreadsheetHandler $connect,
        private readonly GridSpreadsheetHandler $grid,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function listModule(string $module): array
    {
        $definitions = SpreadsheetRegistry::modules()[$module] ?? [];

        return collect($definitions)->map(function (array $definition, string $key) {
            return [
                'key' => $key,
                'label' => $definition['label'],
                'description' => $definition['description'],
                'importable' => $definition['importable'],
                'exportable' => $definition['exportable'],
                'columns' => collect($definition['columns'])->map(fn (array $col) => [
                    'key' => $col['key'],
                    'header' => $col['header'],
                    'required' => $col['required'] ?? false,
                    'example' => $col['example'] ?? '',
                ])->values(),
            ];
        })->values()->all();
    }

    public function downloadTemplate(string $module, string $key): StreamedResponse
    {
        $definition = $this->definition($module, $key);
        $columns = $definition['columns'];
        $example = [];

        foreach ($columns as $column) {
            $example[$column['key']] = $column['example'] ?? '';
        }

        $filename = "{$module}_{$key}_modelo.csv";

        return CsvStream::download($filename, $columns, [$example]);
    }

    public function export(string $module, string $key, Request $request): StreamedResponse
    {
        $definition = $this->definition($module, $key);

        if (! ($definition['exportable'] ?? true)) {
            throw ValidationException::withMessages(['key' => 'Exportacao nao permitida para esta planilha.']);
        }

        $columns = $definition['export_columns'] ?? $definition['columns'];
        $rows = $this->handler($module)->export($key, $request);
        $filename = "{$module}_{$key}_".now()->format('Y-m-d_His').'.csv';

        return CsvStream::download($filename, $columns, $rows);
    }

    /**
     * @return array{total_rows: int, created: int, updated: int, errors: list<array{row: int, message: string}>, preview: list<array<string, string>>}
     */
    public function preview(string $module, string $key, UploadedFile $file): array
    {
        $rows = $this->parseImportFile($module, $key, $file);

        $result = DB::transaction(function () use ($module, $key, $rows) {
            $stats = $this->handler($module)->import($key, $rows);
            DB::rollBack();

            return $stats;
        });

        return [
            'total_rows' => count($rows),
            'created' => $result['created'],
            'updated' => $result['updated'],
            'errors' => $result['errors'],
            'preview' => array_slice($rows, 0, 5),
        ];
    }

    /**
     * @return array{created: int, updated: int, errors: list<array{row: int, message: string}>}
     */
    public function import(string $module, string $key, UploadedFile $file, User $user): array
    {
        $rows = $this->parseImportFile($module, $key, $file);
        $result = $this->handler($module)->import($key, $rows);

        $log = SpreadsheetImportLog::query()->create([
            'user_id' => $user->id,
            'module' => $module,
            'spreadsheet_key' => $key,
            'filename' => $file->getClientOriginalName(),
            'rows_total' => count($rows),
            'created_count' => $result['created'],
            'updated_count' => $result['updated'],
            'errors_count' => count($result['errors']),
            'status' => $result['errors'] === [] ? 'success' : ( ($result['created'] + $result['updated']) > 0 ? 'partial' : 'failed'),
        ]);

        app(\App\Services\Notification\SystemNotificationTriggers::class)
            ->spreadsheetImportFinished($log, $user);

        return $result;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function importLogs(string $module, int $limit = 30): array
    {
        return SpreadsheetImportLog::query()
            ->with('user:id,name')
            ->where('module', $module)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (SpreadsheetImportLog $log) => [
                'id' => $log->id,
                'spreadsheet_key' => $log->spreadsheet_key,
                'filename' => $log->filename,
                'rows_total' => $log->rows_total,
                'created_count' => $log->created_count,
                'updated_count' => $log->updated_count,
                'errors_count' => $log->errors_count,
                'status' => $log->status,
                'user_name' => $log->user?->name,
                'created_at' => $log->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return list<array<string, string>>
     */
    private function parseImportFile(string $module, string $key, UploadedFile $file): array
    {
        $definition = $this->definition($module, $key);

        if (! ($definition['importable'] ?? true)) {
            throw ValidationException::withMessages(['file' => 'Importacao nao permitida para esta planilha.']);
        }

        $columns = $definition['columns'];
        $rows = SpreadsheetFileParser::parse($file, $columns);

        if ($rows === []) {
            throw ValidationException::withMessages(['file' => 'Arquivo vazio ou colunas incompativeis com o modelo.']);
        }

        return $rows;
    }

    /**
     * @return array<string, mixed>
     */
    private function definition(string $module, string $key): array
    {
        $definition = SpreadsheetRegistry::find($module, $key);

        if ($definition === null) {
            throw ValidationException::withMessages(['key' => 'Planilha nao encontrada.']);
        }

        return $definition;
    }

    private function handler(string $module): ConnectSpreadsheetHandler|GridSpreadsheetHandler
    {
        return match ($module) {
            'connect' => $this->connect,
            'grid' => $this->grid,
            default => throw ValidationException::withMessages(['module' => 'Modulo invalido.']),
        };
    }
}
