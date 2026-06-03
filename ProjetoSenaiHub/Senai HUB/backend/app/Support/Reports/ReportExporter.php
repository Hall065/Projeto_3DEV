<?php

namespace App\Support\Reports;

/**
 * Converte relatorio montado em linhas planas (CSV) ou abas (XLSX).
 */
class ReportExporter
{
    /**
     * CSV unico com todas as secoes.
     *
     * @param  array<string, mixed>  $report
     * @return list<array<string, string>>
     */
    public static function flattenToRows(array $report): array
    {
        $rows = [];
        $meta = $report['meta'] ?? [];

        $rows[] = [
            'secao' => 'META',
            'campo' => 'titulo',
            'valor_1' => (string) ($meta['title'] ?? ''),
            'valor_2' => (string) ($meta['subtitle'] ?? ''),
            'valor_3' => (string) (($meta['from_date'] ?? '').' — '.($meta['to_date'] ?? '')),
            'valor_4' => (string) ($meta['generated_at'] ?? ''),
            'valor_5' => '',
            'valor_6' => '',
            'valor_7' => '',
            'valor_8' => '',
        ];

        foreach ($meta['filters'] ?? [] as $filter) {
            $rows[] = [
                'secao' => 'FILTRO',
                'campo' => (string) ($filter['label'] ?? ''),
                'valor_1' => (string) ($filter['value'] ?? ''),
                'valor_2' => '',
                'valor_3' => '',
                'valor_4' => '',
                'valor_5' => '',
                'valor_6' => '',
                'valor_7' => '',
                'valor_8' => '',
            ];
        }

        foreach ($report['sections'] ?? [] as $section) {
            $rows = array_merge($rows, self::flattenSection($section));
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<array{name: string, headers: list<string>, rows: list<list<string>>}>
     */
    public static function sheetsForXlsx(array $report): array
    {
        $sheets = [
            [
                'name' => 'Resumo',
                'headers' => ['Tipo', 'Campo', 'Valor 1', 'Valor 2', 'Valor 3', 'Valor 4'],
                'rows' => [],
            ],
        ];

        $meta = $report['meta'] ?? [];
        $summarySheet = &$sheets[0];
        $summarySheet['rows'][] = ['Meta', 'Titulo', (string) ($meta['title'] ?? ''), (string) ($meta['subtitle'] ?? ''), '', ''];
        $summarySheet['rows'][] = ['Meta', 'Periodo', (string) ($meta['from_date'] ?? ''), (string) ($meta['to_date'] ?? ''), (string) ($meta['generated_at'] ?? ''), ''];

        foreach ($meta['filters'] ?? [] as $filter) {
            $summarySheet['rows'][] = ['Filtro', (string) ($filter['label'] ?? ''), (string) ($filter['value'] ?? ''), '', '', ''];
        }

        foreach ($report['sections'] ?? [] as $section) {
            $type = $section['type'] ?? '';
            $title = self::sheetTitle((string) ($section['title'] ?? $section['id'] ?? 'Secao'));

            if ($type === 'summary' && ! empty($section['paragraphs'])) {
                $summarySheet['rows'][] = ['', '', '', '', '', ''];
                $summarySheet['rows'][] = ['Resumo', $title, '', '', '', ''];
                foreach ($section['paragraphs'] as $paragraph) {
                    $summarySheet['rows'][] = ['Texto', '', (string) $paragraph, '', '', ''];
                }

                continue;
            }

            if ($type === 'kpis' && ! empty($section['items'])) {
                $summarySheet['rows'][] = ['', '', '', '', '', ''];
                $summarySheet['rows'][] = ['KPIs', $title, '', '', '', ''];
                foreach ($section['items'] as $item) {
                    $summarySheet['rows'][] = [
                        'Indicador',
                        (string) ($item['label'] ?? ''),
                        (string) ($item['value'] ?? ''),
                        '',
                        '',
                        '',
                    ];
                }

                continue;
            }

            if ($type === 'chart' && ! empty($section['items'])) {
                $rows = [['Item', 'Valor']];
                foreach ($section['items'] as $item) {
                    $rows[] = [(string) ($item['label'] ?? ''), (string) ($item['value'] ?? '')];
                }
                $sheets[] = ['name' => $title, 'headers' => ['Item', 'Valor'], 'rows' => array_slice($rows, 1)];

                continue;
            }

            if ($type === 'table') {
                $columns = $section['columns'] ?? [];
                $headers = array_map(fn ($c) => (string) ($c['label'] ?? $c['key'] ?? ''), $columns);
                if ($headers === []) {
                    continue;
                }

                $keys = array_map(fn ($c) => (string) ($c['key'] ?? ''), $columns);
                $dataRows = [];
                foreach ($section['rows'] ?? [] as $row) {
                    $line = [];
                    foreach ($keys as $key) {
                        $line[] = (string) ($row[$key] ?? '');
                    }
                    $dataRows[] = $line;
                }

                $sheets[] = ['name' => $title, 'headers' => $headers, 'rows' => $dataRows];
            }
        }

        return $sheets;
    }

    /**
     * @param  array<string, mixed>  $section
     * @return list<array<string, string>>
     */
    private static function flattenSection(array $section): array
    {
        $type = $section['type'] ?? '';
        $title = (string) ($section['title'] ?? $section['id'] ?? 'Secao');
        $rows = [];

        if ($type === 'cover') {
            return [];
        }

        if ($type === 'summary' && ! empty($section['paragraphs'])) {
            foreach ($section['paragraphs'] as $paragraph) {
                $rows[] = self::flatRow($title, 'paragrafo', (string) $paragraph);
            }

            return $rows;
        }

        if ($type === 'kpis' && ! empty($section['items'])) {
            foreach ($section['items'] as $item) {
                $rows[] = self::flatRow($title, (string) ($item['label'] ?? ''), (string) ($item['value'] ?? ''));
            }

            return $rows;
        }

        if ($type === 'chart' && ! empty($section['items'])) {
            foreach ($section['items'] as $item) {
                $rows[] = self::flatRow($title, (string) ($item['label'] ?? ''), (string) ($item['value'] ?? ''));
            }

            return $rows;
        }

        if ($type === 'table') {
            $columns = $section['columns'] ?? [];
            $keys = array_map(fn ($c) => (string) ($c['key'] ?? ''), $columns);
            $labels = array_map(fn ($c) => (string) ($c['label'] ?? $c['key'] ?? ''), $columns);

            if ($labels !== []) {
                $header = ['secao' => $title, 'campo' => 'CABECALHO'];
                foreach ($labels as $i => $label) {
                    $header['valor_'.($i + 1)] = $label;
                }
                for ($i = count($labels); $i < 8; $i++) {
                    $header['valor_'.($i + 1)] = '';
                }
                $rows[] = $header;
            }

            foreach ($section['rows'] ?? [] as $row) {
                $line = ['secao' => $title, 'campo' => 'linha'];
                foreach ($keys as $i => $key) {
                    $line['valor_'.($i + 1)] = (string) ($row[$key] ?? '');
                }
                for ($i = count($keys); $i < 8; $i++) {
                    $line['valor_'.($i + 1)] = '';
                }
                $rows[] = $line;
            }

            $rows[] = self::flatRow('', '', '');
        }

        return $rows;
    }

    /**
     * @return array<string, string>
     */
    private static function flatRow(string $secao, string $campo, string $valor1, string $valor2 = ''): array
    {
        return [
            'secao' => $secao,
            'campo' => $campo,
            'valor_1' => $valor1,
            'valor_2' => $valor2,
            'valor_3' => '',
            'valor_4' => '',
            'valor_5' => '',
            'valor_6' => '',
            'valor_7' => '',
            'valor_8' => '',
        ];
    }

    private static function sheetTitle(string $title): string
    {
        $clean = preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/', '', $title) ?? 'Secao';
        $clean = trim($clean) !== '' ? trim($clean) : 'Secao';

        return mb_substr($clean, 0, 31);
    }
}
