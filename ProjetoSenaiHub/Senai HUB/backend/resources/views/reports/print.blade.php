<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <title>{{ $report['meta']['title'] ?? 'Relatorio SENAI HUB' }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #1a2b3c; margin: 32px; font-size: 12px; }
        .cover { background: linear-gradient(135deg, #002847, #004a7c); color: #fff; padding: 32px; border-radius: 8px; margin-bottom: 32px; page-break-after: always; }
        .cover h1 { margin: 0 0 8px; font-size: 24px; }
        .cover .meta-line { font-size: 11px; opacity: 0.85; margin-top: 4px; }
        section { margin-bottom: 24px; page-break-inside: avoid; }
        section h2 { font-size: 14px; color: #003a6f; border-left: 4px solid #e30613; padding-left: 8px; margin: 0 0 12px; }
        .summary p { margin: 0 0 8px; line-height: 1.5; }
        .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
        .kpi { border: 1px solid #d0d7de; border-radius: 6px; padding: 10px; background: #f8fafc; }
        .kpi-label { font-size: 10px; color: #64748b; }
        .kpi-value { font-size: 18px; font-weight: bold; color: #003a6f; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        th, td { border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; }
        th { background: #f4f6f8; }
        .chart-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; }
        footer { margin-top: 40px; font-size: 10px; color: #888; text-align: center; }
        @media print { body { margin: 16px; } .no-print { display: none; } }
    </style>
</head>
<body>
    @php
        $meta = $report['meta'] ?? [];
        $sections = $report['sections'] ?? [];
    @endphp

    @foreach($sections as $section)
        @if(($section['type'] ?? '') === 'cover')
            <div class="cover">
                <p class="meta-line">{{ strtoupper($meta['module_label'] ?? $module) }}</p>
                <h1>{{ $meta['title'] ?? 'Relatorio' }}</h1>
                @if(!empty($meta['subtitle']))
                    <p>{{ $meta['subtitle'] }}</p>
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
        @elseif(($section['type'] ?? '') === 'summary')
            <section class="summary">
                <h2>{{ $section['title'] ?? 'Resumo' }}</h2>
                @foreach($section['paragraphs'] ?? [] as $paragraph)
                    <p>{{ $paragraph }}</p>
                @endforeach
            </section>
        @elseif(($section['type'] ?? '') === 'kpis')
            <section>
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
            <section>
                <h2>{{ $section['title'] ?? 'Grafico' }}</h2>
                @foreach($section['items'] ?? [] as $item)
                    <div class="chart-row">
                        <span>{{ $item['label'] ?? '' }}</span>
                        <strong>{{ $item['value'] ?? 0 }}</strong>
                    </div>
                @endforeach
            </section>
        @elseif(($section['type'] ?? '') === 'table')
            <section>
                <h2>{{ $section['title'] ?? 'Tabela' }}</h2>
                @if(isset($section['total_rows']))
                    <p style="font-size:10px;color:#64748b;">{{ $section['total_rows'] }} registro(s)</p>
                @endif
                <table>
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
                                <td colspan="{{ max(count($section['columns'] ?? []), 1) }}">Nenhum registro no periodo.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </section>
        @endif
    @endforeach

    <footer>{{ $meta['module_label'] ?? 'SENAI HUB' }} — documento gerado em {{ $meta['generated_at'] ?? now()->format('d/m/Y H:i') }}</footer>
    <script>
        window.addEventListener('load', function () {
            if (window.location.search.indexOf('print=1') !== -1) {
                window.print();
            }
        });
    </script>
</body>
</html>
