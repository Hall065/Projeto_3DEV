<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grid_tickets', function (Blueprint $table) {
            $table->string('approved_by')->nullable()->after('evaluated_at');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->text('approval_notes')->nullable()->after('approved_at');
        });

        DB::table('grid_tickets')->where('status', 'em_andamento')->update(['status' => 'em_atendimento']);
    }

    public function down(): void
    {
        DB::table('grid_tickets')->where('status', 'em_atendimento')->update(['status' => 'em_andamento']);

        Schema::table('grid_tickets', function (Blueprint $table) {
            $table->dropColumn(['approved_by', 'approved_at', 'approval_notes']);
        });
    }
};
