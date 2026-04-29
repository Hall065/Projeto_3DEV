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
        Schema::create('chamados', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->foreignId('id_usuario')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('id_atendente')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->string('local');
            $table->enum('prioridade', ['Baixa', 'Média', 'Alta', 'Urgente'])->default('Média');
            $table->enum('status', ['Aberto', 'Em Análise', 'Fechado'])->default('Aberto');
            $table->text('descricao')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chamados');
    }
};
