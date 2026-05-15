@php
    $statusTotal = max(1, array_sum($chamadosPorStatus));
    $abertos = $chamadosPorStatus['Aberto'] ?? 0;
    $analise = $chamadosPorStatus['Em Análise'] ?? 0;
    $fechados = $chamadosPorStatus['Fechado'] ?? 0;
    $abertosPct = round(($abertos / $statusTotal) * 100, 1);
    $analisePct = round(($analise / $statusTotal) * 100, 1);
    $fechadosPct = round(($fechados / $statusTotal) * 100, 1);

    $linePoints = collect(array_values($chamadosUltimosMeses))->values();
    $maxLine = max(1, $linePoints->max());
    $linePath = $linePoints->map(function ($value, $index) use ($linePoints, $maxLine) {
        $x = 14 + ($index * (360 / max(1, $linePoints->count() - 1)));
        $y = 112 - (($value / $maxLine) * 92);
        return ($index === 0 ? 'M' : 'L') . $x . ',' . $y;
    })->implode(' ');

    $miniStatusTotal = max(1, array_sum($tiposManutencao));
    $corretivoPct = round((($tiposManutencao['Corretivo'] ?? 0) / $miniStatusTotal) * 100, 1);
@endphp

<div class="pf-grid pf-grid-dashboard">
    <div class="pf-grid">
        <div class="pf-grid pf-grid-3">
            <article class="pf-panel pf-stat-card">
                <div class="pf-stat-label">Chamados abertos</div>
                <div class="pf-stat-value">{{ $chamadosAbertos }}</div>
            </article>
            <article class="pf-panel pf-stat-card">
                <div class="pf-stat-label">Em Andamento</div>
                <div class="pf-stat-value">{{ $chamadosUrgentes }}</div>
            </article>
            <article class="pf-panel pf-stat-card">
                <div class="pf-stat-label">Pendentes</div>
                <div class="pf-stat-value">{{ $tarefasPendentes }}</div>
            </article>
        </div>

        <div class="pf-grid" style="grid-template-columns: minmax(0, 1fr);">
            <article class="pf-panel pf-chart">
                <div class="pf-chart-title">
                    <span>Chamados por Status</span>
                    <div class="flex gap-2 text-xs text-white/60">
                        <span class="rounded-xl bg-white/8 px-3 py-1">Manutenção</span>
                        <span class="rounded-xl bg-white/8 px-3 py-1">Últimos 6 meses</span>
                    </div>
                </div>
                <div class="pf-chart-layout">
                    <div class="flex items-center gap-6">
                        <div class="pf-pie" data-value="{{ number_format($abertosPct, 1, ',', '.') }}%"></div>
                        <div class="pf-pie-legend">
                            <div><span class="pf-legend-dot bg-[#cf2629]"></span>Abertos</div>
                            <div><span class="pf-legend-dot bg-[#f19f23]"></span>Em Andamento</div>
                            <div><span class="pf-legend-dot bg-[#c0b037]"></span>Pendentes</div>
                            <div><span class="pf-legend-dot bg-[#608f41]"></span>Concluídos</div>
                        </div>
                    </div>
                    <div class="pf-line-chart">
                        <svg viewBox="0 0 400 130" preserveAspectRatio="none">
                            <path d="{{ $linePath }}" fill="none" stroke="#cf3c43" stroke-width="3" stroke-linecap="round" />
                            @foreach ($linePoints as $index => $value)
                                @php
                                    $x = 14 + ($index * (360 / max(1, $linePoints->count() - 1)));
                                    $y = 112 - (($value / $maxLine) * 92);
                                @endphp
                                <circle cx="{{ $x }}" cy="{{ $y }}" r="4" fill="#cf3c43" />
                            @endforeach
                            <path d="{{ $linePath }}" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="1" stroke-dasharray="4 6" transform="translate(0, 16)" />
                        </svg>
                        <div class="mt-2 flex justify-between px-1 text-xs text-white/45">
                            @foreach (array_keys($chamadosUltimosMeses) as $label)
                                <span>{{ $label }}</span>
                            @endforeach
                        </div>
                    </div>
                </div>
            </article>

            <article class="pf-panel pf-chart">
                <div class="pf-chart-title">
                    <span>Chamados por Mês</span>
                    <div class="flex gap-2 text-xs text-white/60">
                        <span class="rounded-xl bg-white/8 px-3 py-1">Manutenção</span>
                        <span class="rounded-xl bg-white/8 px-3 py-1">Últimos 6 meses</span>
                    </div>
                </div>
                <div class="pf-line-chart">
                    <svg viewBox="0 0 400 130" preserveAspectRatio="none">
                        <path d="{{ $linePath }}" fill="none" stroke="#cf3c43" stroke-width="3" stroke-linecap="round" />
                        @foreach ($linePoints as $index => $value)
                            @php
                                $x = 14 + ($index * (360 / max(1, $linePoints->count() - 1)));
                                $y = 112 - (($value / $maxLine) * 92);
                            @endphp
                            <circle cx="{{ $x }}" cy="{{ $y }}" r="5" fill="#cf3c43" />
                        @endforeach
                    </svg>
                    <div class="mt-2 flex justify-between px-1 text-xs text-white/45">
                        @foreach (array_keys($chamadosUltimosMeses) as $label)
                            <span>{{ $label }}</span>
                        @endforeach
                    </div>
                </div>
            </article>
        </div>

        <div class="pf-grid" style="grid-template-columns: 1.1fr .9fr;">
            <article class="pf-panel pf-chart pf-mini-card">
                <div class="pf-chart-title">
                    <span>Tipos de Manutenção</span>
                </div>
                <div class="pf-chart-layout" style="grid-template-columns: 180px 1fr;">
                    <div class="pf-pie" style="width: 116px; height: 116px; background: conic-gradient(#cf2629 0 {{ $corretivoPct }}%, #f19f23 {{ $corretivoPct }}% {{ $corretivoPct + 28 }}%, #608f41 {{ $corretivoPct + 28 }}% 100%);" data-value="{{ number_format($corretivoPct, 1, ',', '.') }}%"></div>
                    <div class="pf-pie-legend">
                        <div><span class="pf-legend-dot bg-[#cf2629]"></span>Corretivo</div>
                        <div><span class="pf-legend-dot bg-[#f19f23]"></span>Preventivo</div>
                        <div><span class="pf-legend-dot bg-[#608f41]"></span>Preditivo</div>
                    </div>
                </div>
                <div class="mt-3">
                    <a href="{{ route('relatorios.index') }}" class="pf-btn pf-btn-primary">Ver Todos</a>
                </div>
            </article>

            <article class="pf-panel pf-chart pf-mini-card">
                <div class="pf-chart-title">
                    <span>Últimos Chamados</span>
                </div>
                <div class="grid gap-4">
                    @forelse ($ultimosChamadosPainel as $item)
                        <div class="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                            <div>
                                <span class="pf-badge {{ $item->status === 'Fechado' ? 'pf-badge-green' : ($item->prioridade === 'Urgente' ? 'pf-badge-red' : 'pf-badge-gold') }}">{{ $item->status }}</span>
                                <div class="mt-3 font-medium text-white">{{ $item->titulo }}</div>
                                <div class="mt-1 text-xs text-white/45">{{ optional($item->created_at)->format('d \d\e F Y') }}</div>
                            </div>
                            <div class="text-right text-sm text-white/55">{{ $item->local }}</div>
                        </div>
                    @empty
                        <div class="text-white/55">Nenhum chamado recente.</div>
                    @endforelse
                </div>
            </article>
        </div>
    </div>

    <aside class="pf-panel pf-agenda">
        <div class="pf-chart-title !mb-2">
            <span>Agendamentos Hoje</span>
        </div>
        <div class="mb-4 font-heading text-3xl font-bold text-white">{{ now()->translatedFormat('D, d \d\e F') }}</div>
        <div class="flex-1">
            @foreach ($agendaHoje as $agenda)
                <div class="pf-agenda-item">
                    <div class="font-heading text-2xl font-semibold text-white/82">{{ $agenda['hora'] }}</div>
                    <div>
                        <div class="font-medium text-white">{{ $agenda['titulo'] }}</div>
                        <div class="text-sm text-white/45">{{ $agenda['local'] }}</div>
                    </div>
                </div>
            @endforeach
        </div>
        <a href="{{ route('chamados.index') }}" class="pf-btn pf-btn-primary mt-6 self-end">Ver Todos</a>
    </aside>
</div>
