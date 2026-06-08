<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $report['meta']['title'] ?? 'Relatorio SENAI HUB' }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }

        @page {
            size: A4 portrait;
            margin: 16mm 14mm 24mm;

            @bottom-center {
                content: "{{ $report['meta']['module_label'] ?? 'SENAI HUB' }} · Pagina " counter(page) " de " counter(pages);
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 8pt;
                color: #94a3b8;
            }
        }

        @page :first {
            margin-top: 12mm;

            @bottom-center {
                content: none;
            }
        }

        html {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1a2b3c;
            margin: 0;
            padding: 0;
            font-size: 10.5px;
            line-height: 1.5;
            background: #fff;
        }

        .doc-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 10px;
            margin-bottom: 16px;
            border-bottom: 2px solid #e30613;
        }

        .doc-header-brand {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #003a6f;
        }

        .doc-header-title {
            font-size: 11px;
            color: #64748b;
            text-align: right;
        }

        .cover {
            background: #002847;
            color: #fff;
            padding: 36px 32px;
            margin: 0 0 28px;
            border-radius: 0;
            page-break-after: always;
            break-after: page;
            min-height: 220px;
            border-left: 6px solid #e30613;
        }

        .cover h1 {
            margin: 8px 0 6px;
            font-size: 26px;
            line-height: 1.2;
            font-weight: 700;
        }

        .cover .meta-line {
            font-size: 11px;
            opacity: 0.9;
            margin-top: 4px;
        }

        .cover .module-tag {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            opacity: 0.75;
        }

        section {
            margin-bottom: 20px;
        }

        section.section-compact {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        section h2 {
            font-size: 12px;
            color: #003a6f;
            border-left: 4px solid #e30613;
            padding-left: 8px;
            margin: 0 0 10px;
            break-after: avoid;
            page-break-after: avoid;
        }

        .summary {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .summary p {
            margin: 0 0 8px;
            line-height: 1.55;
        }

        .summary-box {
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 12px 14px;
            background: #f8fafc;
        }

        .kpis {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 8px;
        }

        .kpi {
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 10px;
            background: #f8fafc;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .kpi-label {
            font-size: 9px;
            color: #64748b;
            line-height: 1.3;
        }

        .kpi-value {
            font-size: 17px;
            font-weight: 700;
            color: #003a6f;
            margin-top: 4px;
            word-break: break-word;
        }

        .table-meta {
            font-size: 9px;
            color: #64748b;
            margin: 0 0 6px;
        }

        .table-wrap {
            width: 100%;
            overflow: visible;
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 9.5px;
        }

        table.data-table thead {
            display: table-header-group;
        }

        table.data-table th,
        table.data-table td {
            border: 1px solid #c8d0d8;
            padding: 5px 6px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: anywhere;
            hyphens: auto;
        }

        table.data-table th {
            background: #eef2f6;
            font-weight: 600;
            color: #334155;
        }

        table.data-table tbody tr {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        table.data-table tbody tr:nth-child(even) td {
            background: #fafbfc;
        }

        table.data-table.cols-many {
            font-size: 8px;
        }

        table.data-table.cols-many th,
        table.data-table.cols-many td {
            padding: 4px 5px;
        }

        .chart-block {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 12px;
            background: #fff;
        }

        .chart-bar-row {
            display: grid;
            grid-template-columns: minmax(80px, 28%) 1fr minmax(36px, 48px);
            align-items: center;
            gap: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eef2f6;
        }

        .chart-bar-row:last-child {
            border-bottom: none;
        }

        .chart-bar-label {
            font-size: 10px;
            color: #475569;
            word-break: break-word;
        }

        .chart-bar-track {
            height: 10px;
            background: #eef2f6;
            border-radius: 4px;
            overflow: hidden;
        }

        .chart-bar-fill {
            height: 100%;
            border-radius: 4px;
            min-width: 2px;
        }

        .chart-bar-value {
            font-size: 10px;
            font-weight: 600;
            text-align: right;
            color: #003a6f;
        }

        .chart-columns {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            gap: 6px;
            min-height: 140px;
            padding: 8px 4px 4px;
            border-bottom: 1px solid #d0d7de;
        }

        .chart-column {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .chart-column-value {
            font-size: 9px;
            font-weight: 600;
            color: #003a6f;
        }

        .chart-column-bar {
            width: 100%;
            max-width: 36px;
            border-radius: 3px 3px 0 0;
            min-height: 4px;
        }

        .chart-column-label {
            font-size: 8px;
            color: #64748b;
            text-align: center;
            word-break: break-word;
            max-width: 100%;
        }

        .donut-legend {
            display: grid;
            gap: 6px;
        }

        .donut-legend-row {
            display: grid;
            grid-template-columns: 12px minmax(80px, 1fr) auto auto;
            align-items: center;
            gap: 8px;
            font-size: 10px;
        }

        .donut-swatch {
            width: 10px;
            height: 10px;
            border-radius: 2px;
            flex-shrink: 0;
        }

        .donut-pct {
            color: #64748b;
            font-size: 9px;
            text-align: right;
            min-width: 36px;
        }

        .donut-total {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #eef2f6;
            font-size: 10px;
            color: #475569;
        }

        footer.doc-footer {
            margin-top: 28px;
            padding-top: 10px;
            border-top: 1px solid #d0d7de;
            font-size: 8.5px;
            color: #94a3b8;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        @media screen {
            body { padding: 24px; max-width: 210mm; margin: 0 auto; }
        }

        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .cover { border-radius: 0; margin-bottom: 0; }
            footer.doc-footer { margin-bottom: 4mm; }
        }
    </style>
</head>
<body @if(!empty($autoPrint)) data-auto-print="1" @endif>
    @php
        $meta = $report['meta'] ?? [];
        $sections = $report['sections'] ?? [];
        $contentHeaderShown = false;
    @endphp

    @foreach($sections as $section)
        @if(($section['type'] ?? '') === 'cover')
            <div class="cover">
                <p class="module-tag">{{ strtoupper($meta['module_label'] ?? $module) }}</p>
                <h1>{{ $meta['title'] ?? 'Relatorio' }}</h1>
                @if(!empty($meta['subtitle']))
                    <p class="meta-line">{{ $meta['subtitle'] }}</p>
                @endif
                <div style="margin-top: 20px;">
                    @if(!empty($meta['from_date']) || !empty($meta['to_date']))
                        <p class="meta-line">Periodo: {{ $meta['from_date'] ?? '—' }} ate {{ $meta['to_date'] ?? '—' }}</p>
                    @endif
                    <p class="meta-line">Gerado em: {{ $meta['generated_at'] ?? now()->format('d/m/Y H:i') }}</p>
                    @foreach($meta['filters'] ?? [] as $filter)
                        <p class="meta-line">{{ $filter['label'] }}: {{ $filter['value'] }}</p>
                    @endforeach
                </div>
            </div>
        @else
            @if(!$contentHeaderShown)
                <div class="doc-header">
                    <span class="doc-header-brand">{{ $meta['module_label'] ?? 'SENAI HUB' }}</span>
                    <span class="doc-header-title">{{ $meta['title'] ?? 'Relatorio' }}</span>
                </div>
                @php $contentHeaderShown = true; @endphp
            @endif

            @if(($section['type'] ?? '') === 'summary')
                <section class="summary section-compact">
                    <h2>{{ $section['title'] ?? 'Resumo' }}</h2>
                    <div class="summary-box">
                        @foreach($section['paragraphs'] ?? [] as $paragraph)
                            <p>{{ $paragraph }}</p>
                        @endforeach
                    </div>
                </section>
            @elseif(($section['type'] ?? '') === 'kpis')
                <section class="section-compact">
                    <h2>{{ $section['title'] ?? 'Indicadores' }}</h2>
                    <div class="kpis">
                        @foreach($section['items'] ?? [] as $item)
                            <div class="kpi">
                                <div class="kpi-label">{{ $item['label'] ?? '' }}</div>
                                <div class="kpi-value">{{ $item['value'] ?? '' }}</div>
                            </div>
                        @endforeach
                    </div>
                </section>
            @elseif(($section['type'] ?? '') === 'chart')
                @php
                    $chartItems = $section['items'] ?? [];
                    $chartKind = $section['chart_kind'] ?? 'bar_horizontal';
                    $chartMax = max(array_map(fn ($i) => (float) ($i['value'] ?? 0), $chartItems ?: [['value' => 0]]), 1);
                    $chartTotal = array_sum(array_map(fn ($i) => (float) ($i['value'] ?? 0), $chartItems));
                    $palette = ['#003a6f', '#e30613', '#10b981', '#f59e0b', '#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899'];
                @endphp
                <section class="section-compact">
                    <h2>{{ $section['title'] ?? 'Grafico' }}</h2>
                    <div class="chart-block">
                        @if($chartKind === 'bar')
                            <div class="chart-columns">
                                @foreach($chartItems as $index => $item)
                                    @php
                                        $value = (float) ($item['value'] ?? 0);
                                        $color = $item['color'] ?? $palette[$index % count($palette)];
                                        $height = max(4, round(($value / $chartMax) * 110));
                                    @endphp
                                    <div class="chart-column">
                                        <span class="chart-column-value">{{ $value }}</span>
                                        <div class="chart-column-bar" style="height: {{ $height }}px; background: {{ $color }};"></div>
                                        <span class="chart-column-label">{{ $item['label'] ?? '' }}</span>
                                    </div>
                                @endforeach
                            </div>
                        @elseif($chartKind === 'donut')
                            <div class="donut-legend">
                                @foreach($chartItems as $index => $item)
                                    @php
                                        $value = (float) ($item['value'] ?? 0);
                                        $color = $item['color'] ?? $palette[$index % count($palette)];
                                        $pct = $chartTotal > 0 ? round(($value / $chartTotal) * 100, 1) : 0;
                                    @endphp
                                    <div class="donut-legend-row">
                                        <span class="donut-swatch" style="background: {{ $color }};"></span>
                                        <span>{{ $item['label'] ?? '' }}</span>
                                        <strong>{{ $value }}</strong>
                                        <span class="donut-pct">{{ $pct }}%</span>
                                    </div>
                                    <div class="chart-bar-row" style="padding-top: 0; border: none;">
                                        <span></span>
                                        <div class="chart-bar-track">
                                            <div class="chart-bar-fill" style="width: {{ $pct }}%; background: {{ $color }};"></div>
                                        </div>
                                        <span></span>
                                    </div>
                                @endforeach
                            </div>
                            <p class="donut-total">Total: <strong>{{ number_format($chartTotal, 0, ',', '.') }}</strong></p>
                        @else
                            @foreach($chartItems as $index => $item)
                                @php
                                    $value = (float) ($item['value'] ?? 0);
                                    $color = $item['color'] ?? $palette[$index % count($palette)];
                                    $width = round(($value / $chartMax) * 100, 1);
                                @endphp
                                <div class="chart-bar-row">
                                    <span class="chart-bar-label">{{ $item['label'] ?? '' }}</span>
                                    <div class="chart-bar-track">
                                        <div class="chart-bar-fill" style="width: {{ $width }}%; background: {{ $color }};"></div>
                                    </div>
                                    <span class="chart-bar-value">{{ $value }}</span>
                                </div>
                            @endforeach
                        @endif
                    </div>
                </section>
            @elseif(($section['type'] ?? '') === 'table')
                @php
                    $colCount = count($section['columns'] ?? []);
                    $tableClass = $colCount >= 7 ? 'cols-many' : '';
                @endphp
                <section class="section-table">
                    <h2>{{ $section['title'] ?? 'Tabela' }}</h2>
                    @if(isset($section['total_rows']))
                        <p class="table-meta">{{ $section['total_rows'] }} registro(s)</p>
                    @endif
                    <div class="table-wrap">
                        <table class="data-table {{ $tableClass }}">
                            <thead>
                                <tr>
                                    @foreach($section['columns'] ?? [] as $col)
                                        <th>{{ $col['label'] ?? $col['key'] ?? '' }}</th>
                                    @endforeach
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($section['rows'] ?? [] as $row)
                                    <tr>
                                        @foreach($section['columns'] ?? [] as $col)
                                            <td>{{ $row[$col['key']] ?? '—' }}</td>
                                        @endforeach
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="{{ max($colCount, 1) }}">Nenhum registro no periodo.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </section>
            @endif
        @endif
    @endforeach

    <footer class="doc-footer">
        {{ $meta['module_label'] ?? 'SENAI HUB' }} — documento gerado em {{ $meta['generated_at'] ?? now()->format('d/m/Y H:i') }}
    </footer>

    <script>
        (function () {
            if (document.body.dataset.autoPrint !== '1') return;

            function runPrint() {
                setTimeout(function () {
                    window.focus();
                    window.print();
                }, 400);
            }

            if (document.readyState === 'complete') {
                runPrint();
            } else {
                window.addEventListener('load', runPrint);
            }
        })();
    </script>
</body>
</html>
