<?php

namespace App\Services\Reports;

use App\Models\User;
use App\Support\Reports\ReportExporter;
use App\Support\Reports\ReportSchemaRegistry;
use App\Support\Spreadsheet\CsvStream;
use App\Support\Spreadsheet\XlsxWriter;
use Illuminate\Http\JsonResponse;
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
            ['key' => 'secao', 'header' => 'Secao'],
            ['key' => 'campo', 'header' => 'Campo'],
            ['key' => 'valor_1', 'header' => 'Valor 1'],
            ['key' => 'valor_2', 'header' => 'Valor 2'],
            ['key' => 'valor_3', 'header' => 'Valor 3'],
            ['key' => 'valor_4', 'header' => 'Valor 4'],
            ['key' => 'valor_5', 'header' => 'Valor 5'],
            ['key' => 'valor_6', 'header' => 'Valor 6'],
            ['key' => 'valor_7', 'header' => 'Valor 7'],
            ['key' => 'valor_8', 'header' => 'Valor 8'],
        ];

        $filename = "{$module}_relatorio_".now()->format('Y-m-d_His').'.csv';

        return CsvStream::download($filename, $columns, ReportExporter::flattenToRows($report));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function exportXlsx(string $module, array $payload, ?User $user = null): StreamedResponse
    {
        $report = $this->build($module, $payload, $user);
        $filename = "{$module}_relatorio_".now()->format('Y-m-d_His').'.xlsx';

        return XlsxWriter::download($filename, ReportExporter::sheetsForXlsx($report));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function exportJson(string $module, array $payload, ?User $user = null): JsonResponse
    {
        $report = $this->build($module, $payload, $user);

        return response()->json(['data' => $report]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function exportHtml(string $module, array $payload, ?User $user = null, bool $download = false, bool $autoPrint = false): \Illuminate\View\View|\Illuminate\Http\Response
    {
        $report = $this->build($module, $payload, $user);
        $view = view('reports.print', [
            'report' => $report,
            'module' => $module,
            'autoPrint' => $autoPrint,
        ]);

        if (! $download) {
            return $view;
        }

        $filename = "{$module}_relatorio_".now()->format('Y-m-d_His').'.html';

        return response($view->render(), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
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
