<x-layouts::auth :title="__('Criar conta')">
    <img src="{{ asset('images/logos/logo-branco.png') }}" alt="PredialFix" class="pf-auth-logo" />

    <p class="mb-1 text-sm text-white/70">Criar sua Conta no Portal Senai</p>
    <div class="pf-auth-title">Cadastro</div>

    @if ($errors->any())
        <div class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {{ $errors->first() }}
        </div>
    @endif

    <form method="POST" action="{{ route('register.store') }}" class="space-y-4">
            @csrf

        <div>
            <label class="pf-label" for="name">Nome Completo</label>
            <input id="name" name="name" type="text" value="{{ old('name') }}" required autofocus autocomplete="name" class="pf-input" />
        </div>

        <div>
            <label class="pf-label" for="email">Email ou CPF</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required autocomplete="email" class="pf-input" />
        </div>

        <div>
            <label class="pf-label" for="cpf">CPF</label>
            <input id="cpf" name="cpf" type="text" value="{{ old('cpf') }}" required autocomplete="off" class="pf-input" />
        </div>

        <div>
            <label class="pf-label" for="password">Senha</label>
            <input id="password" name="password" type="password" required autocomplete="new-password" class="pf-input" />
        </div>

        <div>
            <label class="pf-label" for="password_confirmation">Confirmar Senha</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password" class="pf-input" />
        </div>

        <button type="submit" class="pf-btn pf-btn-primary w-full" data-test="register-user-button">Avançar</button>
    </form>

    <div class="mt-5 text-center text-sm text-white/60">
        Já Possui conta?
        <a href="{{ route('login') }}" class="font-semibold text-red-400 hover:text-red-300" wire:navigate>Fazer Login</a>
    </div>
</x-layouts::auth>
