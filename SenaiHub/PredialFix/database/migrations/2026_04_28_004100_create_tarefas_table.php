<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tarefas', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->foreignId('id_responsavel')->constrained('usuarios')->onDelete('cascade');
            $table->string('localizacao');
            $table->enum('prioridade', ['Baixa', 'Média', 'Alta', 'Urgente'])->default('Média');
            $table->enum('status', ['Pendente', 'Em Andamento', 'Concluído'])->default('Pendente');
            $table->date('data_inicio');
            $table->date('data_final');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarefas');
    }
};
