<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connect_contracts', function (Blueprint $table) {
            $table->unsignedTinyInteger('weekly_hours')->nullable()->after('contract_type');
            $table->string('company_email')->nullable()->after('company_name');
        });
    }

    public function down(): void
    {
        Schema::table('connect_contracts', function (Blueprint $table) {
            $table->dropColumn(['weekly_hours', 'company_email']);
        });
    }
};
