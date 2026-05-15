<?php

use App\Http\Controllers\LeadController;
use App\Http\Controllers\RelatorioController;
use Illuminate\Support\Facades\Route;

Route::get('/', [App\Http\Controllers\LandingController::class, 'index'])->name('home');
Route::post('/lead', [LeadController::class, 'store'])->middleware('throttle:5,1')->name('lead.store');
Route::view('/politica-privacidade', 'pages.politica-privacidade')->name('politica');
Route::view('/termos-de-uso', 'pages.termos')->name('termos');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::view('dashboard', 'dashboard')->name('dashboard');

    Route::get('relatorios', [RelatorioController::class, 'index'])->name('relatorios.index');
    
    Route::resource('usuarios', App\Http\Controllers\UsuarioController::class);
    Route::resource('estoques', App\Http\Controllers\EstoqueController::class);
    Route::resource('chamados', App\Http\Controllers\ChamadoController::class);
    Route::resource('tarefas', App\Http\Controllers\TarefaController::class);
});

require __DIR__.'/settings.php';
