@props([
    'sidebar' => false,
])

@if($sidebar)
    <flux:sidebar.brand name="PredialFix" {{ $attributes }}>
        <x-slot name="logo" class="flex items-center justify-center">
            <img src="{{ asset('images/logos/logo-principal.png') }}" alt="PredialFix" class="h-8 w-auto" />
        </x-slot>
    </flux:sidebar.brand>
@else
    <flux:brand name="PredialFix" {{ $attributes }}>
        <x-slot name="logo" class="flex items-center justify-center">
            <img src="{{ asset('images/logos/logo-principal.png') }}" alt="PredialFix" class="h-8 w-auto" />
        </x-slot>
    </flux:brand>
@endif
