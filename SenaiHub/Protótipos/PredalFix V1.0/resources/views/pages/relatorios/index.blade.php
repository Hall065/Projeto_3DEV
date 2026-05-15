<x-layouts::app :title="__('Relatórios')">
    @php
        $custos = $custosPorCategoria->values()->all();
        $labels = $custosPorCategoria->keys()->all();
        $totalCustos = max(1, array_sum($custos));
        $percentuais = collect($custos)->map(fn ($valor) => round(($valor / $totalCustos) * 100, 1))->values();
        $cores = ['#cf2629', '#f19f23', '#608f41', '#cfcfcf'];
        $start = 0;
        $segments = [];

        foreach ($percentuais as $index => $percentual) {
            $end = $start + $percentual;
            $segments[] = "{$cores[$index % count($cores)]} {$start}% {$end}%";
            $start = $end;
        }

        $lineValues = collect($historico);
        $maxLine = max(1, $lineValues->max());
        $linePath = $lineValues->map(function ($value, $index) use ($lineValues, $maxLine) {
            $x = 18 + ($index * (488 / max(1, $lineValues->count() - 1)));
            $y = 118 - (($value / $maxLine) * 88);
            return ($index === 0 ? 'M' : 'L') . $x . ',' . $y;
        })->implode(' ');
    @endphp

    <div class="pf-grid pf-grid-dashboard">
        <div class="pf-grid">
            <div class="pf-grid pf-grid-3">
                <article class="pf-panel pf-stat-card">
                    <div class="pf-stat-label">Total Relatórios Gerados:</div>
                    <div class="pf-stat-value">{{ $totalRelatorios }}</div>
                </article>
                <article class="pf-panel pf-stat-card">
                    <div class="pf-stat-label">Relatórios Pendentes:</div>
                    <div class="pf-stat-value text-[#fcce14]">{{ $relatoriosPendentes }}</div>
                </article>
                <article class="pf-panel pf-stat-card">
                    <div class="pf-stat-label">Relatório Alerta de Custo:</div>
                    <div class="pf-stat-value text-[#ff2a2a]">{{ $alertasCusto }}</div>
                </article>
            </div>

            <div class="pf-grid" style="grid-template-columns: 1.1fr .9fr;">
                <article class="pf-panel pf-chart">
                    <div class="pf-chart-title"><span>Custos de Manutenção por Categoria</span></div>
                    <div class="pf-chart-layout" style="grid-template-columns: 220px 1fr;">
                        <div class="pf-pie" style="background: conic-gradient({{ implode(',', $segments) }});" data-value=""></div>
                        <div class="pf-pie-legend">
                            @foreach ($labels as $index => $label)
                                <div><span class="pf-legend-dot" style="background: {{ $cores[$index % count($cores)] }}"></span>{{ $label }}</div>
                            @endforeach
                        </div>
                    </div>
                </article>

                <article class="pf-panel pf-chart">
                    <div class="pf-chart-title"><span>MTTR (Tempo Médio de Reparo)</span></div>
                    <div class="pf-bar-chart">
                        <svg viewBox="0 0 340 140" preserveAspectRatio="none">
                            @foreach ($mttCategorias as $index => $item)
                                @php
                                    $x = 18 + ($index * 78);
                                    $metaY = 122 - ($item['meta'] * 2);
                                    $atualY = 122 - ($item['atual'] * 2);
                                @endphp
                                <rect x="{{ $x }}" y="{{ $atualY }}" width="24" height="{{ 122 - $atualY }}" rx="4" fill="#cf3c43" />
                                <rect x="{{ $x + 32 }}" y="{{ $metaY }}" width="24" height="{{ 122 - $metaY }}" rx="4" fill="rgba(255,255,255,.72)" />
                                <text x="{{ $x + 24 }}" y="136" text-anchor="middle" fill="rgba(255,255,255,.6)" font-size="10">{{ $item['nome'] }}</text>
                            @endforeach
                        </svg>
                    </div>
                </article>
            </div>

            <article class="pf-panel pf-chart">
                <div class="pf-chart-title"><span>Histórico de Custos Mensais</span></div>
                <div class="pf-line-chart">
                    <svg viewBox="0 0 540 136" preserveAspectRatio="none">
                        <path d="{{ $linePath }}" fill="none" stroke="#cf3c43" stroke-width="3" stroke-linecap="round" />
                        @foreach ($lineValues as $index => $value)
                            @php
                                $x = 18 + ($index * (488 / max(1, $lineValues->count() - 1)));
                                $y = 118 - (($value / $maxLine) * 88);
                            @endphp
                            <circle cx="{{ $x }}" cy="{{ $y }}" r="4" fill="#cf3c43" />
                        @endforeach
                    </svg>
                    <div class="mt-2 flex justify-between px-1 text-xs text-white/45">
                        @foreach (['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as $mes)
                            <span>{{ $mes }}</span>
                        @endforeach
                    </div>
                </div>
            </article>
        </div>

        <aside class="pf-panel pf-agenda">
            <div class="pf-chart-title"><span>Resumo de Falhas Frequentes</span></div>
            <div class="pf-table-wrap rounded-[18px] bg-white/4">
                <table class="pf-table min-w-0">
                    <thead>
                        <tr>
                            <th>Ativo</th>
                            <th>Nº Falhas</th>
                            <th>Tempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($falhasFrequentes as $falha)
                            <tr>
                                <td>{{ $falha['ativo'] }}</td>
                                <td>{{ $falha['falhas'] }}</td>
                                <td>{{ $falha['tempo'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <a href="{{ route('dashboard') }}" class="pf-btn pf-btn-primary mt-auto self-end">Ver Todos</a>
        </aside>
    </div>
</x-layouts::app>
