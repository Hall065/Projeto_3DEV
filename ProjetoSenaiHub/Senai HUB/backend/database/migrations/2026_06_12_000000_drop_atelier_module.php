<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('atelier_compras');
        Schema::dropIfExists('atelier_item_pedidos');
        Schema::dropIfExists('atelier_pedidos');
        Schema::dropIfExists('atelier_estoques');
        Schema::dropIfExists('atelier_produtos');
        Schema::dropIfExists('atelier_clients');
        Schema::dropIfExists('atelier_fornecedores');

        if (Schema::hasColumn('users', 'atelier_client_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['atelier_client_id']);
            });

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('atelier_client_id');
            });
        }

        DB::table('users')
            ->whereIn('role', [
                'atelier_admin',
                'atelier_funcionario',
                'atelier_vendedor',
                'atelier_cliente',
            ])
            ->update(['role' => 'unassigned']);

        DB::table('applications')->where('slug', 'atelier')->delete();
    }

    public function down(): void
    {
        // Módulo Ateliê removido do projeto; rollback não recria as tabelas.
    }
};
