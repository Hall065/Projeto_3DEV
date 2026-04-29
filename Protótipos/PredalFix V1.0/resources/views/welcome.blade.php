<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @include('partials.head')
    </head>
    <body>
        <div class="pf-page">
            <header class="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-black/35 backdrop-blur-xl">
                <div class="pf-container flex items-center justify-between gap-6 py-5">
                    <a href="{{ route('home') }}" class="w-[190px]">
                        <img src="{{ asset('images/logos/logo-branco.png') }}" alt="PredialFix" />
                    </a>

                    <nav class="hidden items-center gap-8 text-sm font-semibold text-white/75 lg:flex">
                        <a href="#inicio">Início</a>
                        <a href="#sobre">Serviços</a>
                        <a href="#como-funciona">Como Funciona</a>
                        <a href="#planos">Planos</a>
                        <a href="#faq">FAQ</a>
                    </nav>

                    <div class="flex items-center gap-3">
                        @auth
                            <a href="{{ route('dashboard') }}" class="pf-btn pf-btn-secondary">Meu Painel</a>
                        @else
                            <a href="{{ route('login') }}" class="pf-btn pf-btn-secondary" wire:navigate>Entrar</a>
                            <a href="#contato" class="pf-btn pf-btn-primary">Solicitar Demonstração</a>
                        @endauth
                    </div>
                </div>
            </header>

            <main>
                <section id="inicio" class="pf-landing-hero">
                    <div class="pf-cubes">
                        @foreach ([
                            ['size' => 150, 'left' => '-3%', 'bottom' => '-6%', 'rotate' => 'rotateX(-18deg) rotateY(30deg)'],
                            ['size' => 110, 'left' => '11%', 'bottom' => '4%', 'rotate' => 'rotateX(-18deg) rotateY(32deg)'],
                            ['size' => 80, 'left' => '25%', 'bottom' => '-2%', 'rotate' => 'rotateX(-18deg) rotateY(32deg)'],
                            ['size' => 84, 'right' => '11%', 'top' => '7%', 'rotate' => 'rotateX(-18deg) rotateY(-32deg)'],
                            ['size' => 58, 'right' => '20%', 'top' => '16%', 'rotate' => 'rotateX(-18deg) rotateY(-32deg)'],
                        ] as $cube)
                            <div class="pf-cube" style="--size: {{ $cube['size'] }}px; width: {{ $cube['size'] }}px; height: {{ $cube['size'] }}px; left: {{ $cube['left'] ?? 'auto' }}; right: {{ $cube['right'] ?? 'auto' }}; top: {{ $cube['top'] ?? 'auto' }}; bottom: {{ $cube['bottom'] ?? 'auto' }}; transform: {{ $cube['rotate'] }};">
                                <span class="pf-cube-face front"></span>
                                <span class="pf-cube-face back"></span>
                                <span class="pf-cube-face right"></span>
                                <span class="pf-cube-face left"></span>
                                <span class="pf-cube-face top"></span>
                                <span class="pf-cube-face bottom"></span>
                            </div>
                        @endforeach
                    </div>

                    <div class="pf-container pf-landing-grid">
                        <div class="relative z-10">
                            <span class="pf-eyebrow">
                                <span class="inline-block size-2 rounded-full bg-[#00c2a8]"></span>
                                Manutenção Predial Senai
                            </span>
                            <h1 class="font-heading text-shadow-soft text-5xl font-bold leading-[1.02] text-white sm:text-6xl">
                                Manutenção predial
                                <span class="text-[#fc9432]">simplificada</span>
                                e eficiente
                            </h1>
                            <p class="mt-6 max-w-xl text-lg leading-8 text-white/70">
                                Gerencie chamados, tarefas, estoque e relatórios em um único ambiente criado para a rotina operacional das unidades SENAI.
                            </p>
                            <div class="mt-8 flex flex-wrap gap-3">
                                <a href="#contato" class="pf-btn pf-btn-primary px-8">Solicitar Demonstração</a>
                                <a href="#como-funciona" class="pf-btn pf-btn-secondary px-8">Ver como funciona</a>
                            </div>
                            <div class="mt-10 flex flex-wrap gap-10">
                                <div>
                                    <div class="font-heading text-4xl font-bold text-white">+50</div>
                                    <div class="text-sm text-white/55">Unidades SENAI</div>
                                </div>
                                <div>
                                    <div class="font-heading text-4xl font-bold text-white">98%</div>
                                    <div class="text-sm text-white/55">Satisfação</div>
                                </div>
                                <div>
                                    <div class="font-heading text-4xl font-bold text-white">24h</div>
                                    <div class="text-sm text-white/55">Tempo médio</div>
                                </div>
                            </div>
                        </div>

                        <div id="contato" class="pf-card relative z-10 p-8">
                            <h2 class="font-heading text-3xl font-bold text-white">Solicite um orçamento</h2>
                            <p class="mt-2 text-sm text-white/60">Preencha e entraremos em contato em até 1h útil.</p>

                            @if (session('status'))
                                <div class="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                    {{ session('status') }}
                                </div>
                            @endif

                            <form action="{{ route('lead.store') }}" method="POST" class="mt-6 space-y-4">
                                @csrf
                                <div>
                                    <label class="pf-label" for="nome">Nome completo *</label>
                                    <input id="nome" name="nome" value="{{ old('nome') }}" class="pf-input" required />
                                </div>
                                <div>
                                    <label class="pf-label" for="lead_email">E-mail *</label>
                                    <input id="lead_email" type="email" name="email" value="{{ old('email') }}" class="pf-input" required />
                                </div>
                                <div>
                                    <label class="pf-label" for="telefone">WhatsApp *</label>
                                    <input id="telefone" name="telefone" value="{{ old('telefone') }}" class="pf-input" required />
                                </div>
                                <div>
                                    <label class="pf-label" for="tipo_imovel">Tipo de imóvel</label>
                                    <select id="tipo_imovel" name="tipo_imovel" class="pf-select">
                                        <option value="">Selecione...</option>
                                        <option value="residencial">Residencial</option>
                                        <option value="comercial">Comercial</option>
                                        <option value="industrial">Industrial</option>
                                        <option value="condominio">Condomínio</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="pf-label" for="mensagem">Mensagem</label>
                                    <textarea id="mensagem" name="mensagem" rows="4" class="pf-textarea">{{ old('mensagem') }}</textarea>
                                </div>
                                <button type="submit" class="pf-btn pf-btn-primary w-full">Solicitar Orçamento Grátis</button>
                                <p class="text-center text-xs text-white/45">Seus dados estão seguros. Sem spam.</p>
                            </form>
                        </div>
                    </div>
                </section>

                <section id="sobre" class="pf-section pf-section-alt">
                    <div class="pf-container">
                        <div class="pf-section-heading">
                            <span class="pf-eyebrow">Diferenciais</span>
                            <h2 class="pf-section-title">Uma plataforma completa para manutenção predial</h2>
                            <p class="pf-section-subtitle">Visual operacional, acompanhamento em tempo real e tomada de decisão centralizada.</p>
                        </div>
                        <div class="pf-feature-grid">
                            @foreach ($diferenciais as $item)
                                <article class="pf-card">
                                    <div class="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#00c2a8]/18 font-heading text-xl font-bold text-[#00c2a8]">
                                        {{ Str::of($item['titulo'])->substr(0, 1) }}
                                    </div>
                                    <h3 class="font-heading text-xl font-semibold text-white">{{ $item['titulo'] }}</h3>
                                    <p class="mt-3 leading-7 text-white/65">{{ $item['descricao'] }}</p>
                                </article>
                            @endforeach
                        </div>
                    </div>
                </section>

                <section class="pf-section">
                    <div class="pf-container">
                        <div class="pf-section-heading">
                            <span class="pf-eyebrow">Serviços</span>
                            <h2 class="pf-section-title">Cobertura para a rotina operacional completa</h2>
                            <p class="pf-section-subtitle">Do chamado inicial ao fechamento, com histórico e visibilidade para gestão e execução.</p>
                        </div>
                        <div class="pf-service-grid">
                            @foreach ($servicos as $servico)
                                <article class="pf-card">
                                    <div class="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#fc9432]/16 font-heading text-xl font-bold text-[#fc9432]">
                                        {{ $servico['icone'] }}
                                    </div>
                                    <h3 class="font-heading text-xl font-semibold text-white">{{ $servico['titulo'] }}</h3>
                                    <p class="mt-3 leading-7 text-white/65">{{ $servico['descricao'] }}</p>
                                </article>
                            @endforeach
                        </div>
                    </div>
                </section>

                <section id="como-funciona" class="pf-section pf-section-alt">
                    <div class="pf-container">
                        <div class="pf-section-heading">
                            <span class="pf-eyebrow">Processo</span>
                            <h2 class="pf-section-title">Como funciona</h2>
                            <p class="pf-section-subtitle">Fluxo simples para abertura, execução e monitoramento das demandas.</p>
                        </div>
                        <div class="grid gap-5 lg:grid-cols-4">
                            @foreach ($passos as $index => $passo)
                                <article class="pf-card text-center">
                                    <div class="mx-auto mb-6 grid size-20 place-items-center rounded-full border-4 border-[#fc9432] bg-black/25 font-heading text-3xl font-bold text-[#fc9432]">
                                        {{ $index + 1 }}
                                    </div>
                                    <h3 class="font-heading text-2xl font-semibold text-white">{{ $passo['titulo'] }}</h3>
                                    <p class="mt-3 leading-7 text-white/65">{{ $passo['descricao'] }}</p>
                                </article>
                            @endforeach
                        </div>
                    </div>
                </section>

                <section class="pf-section">
                    <div class="pf-container">
                        <div class="pf-section-heading">
                            <span class="pf-eyebrow">Depoimentos</span>
                            <h2 class="pf-section-title">O que dizem nossos clientes</h2>
                        </div>
                        <div class="grid gap-5 lg:grid-cols-3">
                            @foreach ($depoimentos as $item)
                                <article class="pf-card">
                                    <div class="mb-4 text-[#fcce14]">★★★★★</div>
                                    <p class="leading-8 text-white/70">“{{ $item['texto'] }}”</p>
                                    <div class="mt-6">
                                        <div class="font-heading text-lg font-semibold text-white">{{ $item['nome'] }}</div>
                                        <div class="text-sm text-white/50">{{ $item['cargo'] }}</div>
                                    </div>
                                </article>
                            @endforeach
                        </div>
                    </div>
                </section>

                <section id="planos" class="pf-section pf-section-alt">
                    <div class="pf-container">
                        <div class="pf-section-heading">
                            <span class="pf-eyebrow">Planos</span>
                            <h2 class="pf-section-title">Escolha o plano ideal</h2>
                            <p class="pf-section-subtitle">Estruturas pensadas para unidades isoladas, equipes ativas e gestão regional.</p>
                        </div>
                        <div class="pf-plan-grid">
                            @foreach ($planos as $plano)
                                <article class="pf-card {{ $plano['destaque'] ? 'border-[#fcce14]/35 bg-[linear-gradient(180deg,rgba(252,148,50,.9),rgba(167,59,16,.9))]' : '' }}">
                                    @if ($plano['destaque'])
                                        <div class="mb-4 inline-flex rounded-full bg-[#fcce14] px-4 py-1 text-sm font-bold text-black">Mais Popular</div>
                                    @endif
                                    <h3 class="font-heading text-2xl font-bold text-white">{{ $plano['nome'] }}</h3>
                                    <p class="mt-2 text-white/65">{{ $plano['descricao'] }}</p>
                                    <div class="mt-6 font-heading text-4xl font-bold text-white">R$ {{ $plano['preco'] }}</div>
                                    <ul class="mt-6 space-y-3 text-white/75">
                                        @foreach ($plano['features'] as $feature)
                                            <li>• {{ $feature }}</li>
                                        @endforeach
                                    </ul>
                                    <a href="#contato" class="pf-btn {{ $plano['destaque'] ? 'mt-8 bg-white text-[#b53e14]' : 'pf-btn-secondary mt-8' }}">Quero este plano</a>
                                </article>
                            @endforeach
                        </div>
                    </div>
                </section>

                <section id="faq" class="pf-section">
                    <div class="pf-container">
                        <div class="pf-section-heading">
                            <span class="pf-eyebrow">FAQ</span>
                            <h2 class="pf-section-title">Perguntas frequentes</h2>
                        </div>
                        <div class="pf-accordion">
                            @foreach ($faqs as $faq)
                                <details @if($loop->first) open @endif>
                                    <summary>{{ $faq['pergunta'] }}</summary>
                                    <div class="px-6 pb-6 leading-7 text-white/65">{{ $faq['resposta'] }}</div>
                                </details>
                            @endforeach
                        </div>
                    </div>
                </section>

                <section class="pf-section bg-[linear-gradient(135deg,#fc9432,#ca4a12,#00c2a8)]">
                    <div class="pf-container text-center">
                        <h2 class="font-heading text-4xl font-bold text-white sm:text-5xl">Pronto para transformar a gestão da sua unidade SENAI?</h2>
                        <p class="mx-auto mt-5 max-w-3xl text-lg leading-8 text-white/82">
                            Centralize chamados, estoque, execução e relatórios em uma única experiência visual e operacional.
                        </p>
                        <div class="mt-8 flex flex-wrap justify-center gap-4">
                            <a href="#contato" class="pf-btn bg-white px-10 text-[#ca4a12]">Começar Agora</a>
                            <a href="{{ route('login') }}" class="pf-btn border border-white/60 bg-white/10 px-10 text-white" wire:navigate>Entrar no Portal</a>
                        </div>
                    </div>
                </section>
            </main>

            <footer class="border-t border-white/5 bg-black/40 py-16">
                <div class="pf-container">
                    <div class="pf-footer-grid">
                        <div>
                            <img src="{{ asset('images/logos/logo-branco.png') }}" alt="PredialFix" class="w-[190px]" />
                            <p class="mt-5 max-w-sm leading-7 text-white/60">Plataforma completa para gestão de manutenção predial de unidades SENAI, com visão operacional e gerencial integrada.</p>
                        </div>
                        <div>
                            <div class="font-heading text-lg font-semibold text-white">Navegação</div>
                            <div class="mt-4 grid gap-3 text-white/60">
                                <a href="#inicio">Início</a>
                                <a href="#sobre">Serviços</a>
                                <a href="#como-funciona">Como funciona</a>
                                <a href="#planos">Planos</a>
                            </div>
                        </div>
                        <div>
                            <div class="font-heading text-lg font-semibold text-white">Portal</div>
                            <div class="mt-4 grid gap-3 text-white/60">
                                <a href="{{ route('login') }}" wire:navigate>Login</a>
                                <a href="{{ route('register') }}" wire:navigate>Cadastro</a>
                                <a href="{{ route('politica') }}">Política de Privacidade</a>
                                <a href="{{ route('termos') }}">Termos de Uso</a>
                            </div>
                        </div>
                        <div>
                            <div class="font-heading text-lg font-semibold text-white">Contato</div>
                            <div class="mt-4 grid gap-3 text-white/60">
                                <span>São Paulo, SP</span>
                                <span>(11) 99999-9999</span>
                                <span>contato@predialfix.com.br</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-12 border-t border-white/6 pt-6 text-sm text-white/45">
                        © {{ date('Y') }} PredialFix. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
        @fluxScripts
    </body>
</html>
