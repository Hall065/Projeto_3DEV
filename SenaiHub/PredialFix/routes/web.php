<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::view('dashboard', 'dashboard')->name('dashboard');
    
    Route::resource('usuarios', App\Http\Controllers\UsuarioController::class);
    Route::resource('estoques', App\Http\Controllers\EstoqueController::class);
    Route::resource('chamados', App\Http\Controllers\ChamadoController::class);
    Route::resource('tarefas', App\Http\Controllers\TarefaController::class);
});

require __DIR__.'/settings.php';
