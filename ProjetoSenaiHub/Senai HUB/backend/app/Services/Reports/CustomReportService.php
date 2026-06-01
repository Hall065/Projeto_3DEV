<?php

namespace App\Services\Reports;

use App\Models\User;
use App\Support\Reports\ReportSchemaRegistry;
use App\Support\Spreadsheet\CsvStream;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomReportService
{
    public function __construct(
        private readonly ConnectReportBuilderService $connect,
        private readonly GridReportBuilderService $grid,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function schema(string $module): array
    {
        $schema = ReportSchemaRegistry::schema($module);
        if ($schema === []) {
            throw ValidationException::withMessages(['module' => 'Modulo de relatorio invalido.']);
        }

        return $schema;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function build(string $module, array $payload, ?User $user = null): array
    {
        $config = $this->validateConfig($module, $payload);

        return match ($module) {
            'connect' => $this->connect->build($config, $user),
            'grid' => $this->grid->build($config),
            default => throw ValidationException::withMessages(['module' => 'Modulo invalido.']),
        };
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function exportCsv(string $module, array $payload, ?User $user = null): StreamedResponse
    {
        $report = $this->build($module, $payload, $user);
        $columns = [
            ['key' => 'secao', 'header' => 'secao'],
            ['key' => 'coluna_1', 'header' => 'coluna_1'],
            ['key' => 'coluna_2', 'header' => 'coluna_2'],
            ['key' => 'coluna_3', 'header' => 'coluna_3'],
            ['key' => 'coluna_4', 'header' => 'coluna_4'],
            ['key' => 'coluna_5', 'header' => 'coluna_5'],
            ['key' => 'coluna_6', 'header' => 'coluna_6'],
            ['key' => 'coluna_7', 'header' => 'coluna_7'],
            ['key' => 'coluna_8', 'header' => 'coluna_8'],
        ];

        $rows = [];

        foreach ($report['sections'] as $section) {
            if (($section['type'] ?? '') !== 'table') {
                continue;
            }

            $sectionColumns = $section['columns'] ?? [];
            $headerRow = [
                'secao' => $section['title'] ?? 'Tabela',
                'coluna_1' => $sectionColumns[0]['label'] ?? '',
                'coluna_2' => $sectionColumns[1]['label'] ?? '',
                'coluna_3' => $sectionColumns[2]['label'] ?? '',
                'coluna_4' => $sectionColumns[3]['label'] ?? '',
                'coluna_5' => $sectionColumns[4]['label'] ?? '',
                'coluna_6' => $sectionColumns[5]['label'] ?? '',
                'coluna_7' => $sectionColumns[6]['label'] ?? '',
                'coluna_8' => $sectionColumns[7]['label'] ?? '',
            ];
            $rows[] = $headerRow;

            foreach ($section['rows'] ?? [] as $row) {
                $flat = ['secao' => ''];
                foreach ($sectionColumns as $index => $col) {
                    $flat['coluna_'.($index + 1)] = $row[$col['key']] ?? '';
                }
                $rows[] = $flat;
            }

            $rows[] = ['secao' => '', 'coluna_1' => '', 'coluna_2' => '', 'coluna_3' => '', 'coluna_4' => '', 'coluna_5' => '', 'coluna_6' => '', 'coluna_7' => '', 'coluna_8' => ''];
        }

        $filename = "{$module}_relatorio_".now()->format('Y-m-d_His').'.csv';

        return CsvStream::download($filename, $columns, $rows);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function exportHtml(string $module, array $payload, ?User $user = null): \Illuminate\View\View
    {
        $report = $this->build($module, $payload, $user);

        return view('reports.print', [
            'report' => $report,
            'module' => $module,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function validateConfig(string $module, array $payload): array
    {
        $schema = $this->schema($module);
        $validSections = collect($schema['sections'] ?? [])->pluck('id')->all();

        $validated = validator($payload, [
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*' => ['string', Rule::in($validSections)],
            'filters' => ['nullable', 'array'],
            'columns' => ['nullable', 'array'],
        ])->validate();

        if (! in_array('cover', $validated['sections'], true)) {
            array_unshift($validated['sections'], 'cover');
        }

        return $validated;
    }
}
