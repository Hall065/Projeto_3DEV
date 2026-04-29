<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'cpf')) {
                $table->string('cpf', 14)->nullable()->unique()->after('email');
            }

            if (! Schema::hasColumn('users', 'tipo')) {
                $table->string('tipo')->default('colaborador')->after('cpf');
            }

            if (! Schema::hasColumn('users', 'ativo')) {
                $table->boolean('ativo')->default(true)->after('tipo');
            }

            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('email_verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $drops = [];

            foreach (['cpf', 'tipo', 'ativo', 'last_login_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $drops[] = $column;
                }
            }

            if ($drops !== []) {
                $table->dropColumn($drops);
            }
        });
    }
};
