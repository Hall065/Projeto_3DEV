<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_presets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('module', 20);
            $table->string('name');
            $table->json('config');
            $table->boolean('is_shared')->default(false);
            $table->timestamps();

            $table->index(['module', 'user_id']);
        });

        Schema::create('spreadsheet_import_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('module', 20);
            $table->string('spreadsheet_key');
            $table->string('filename')->nullable();
            $table->unsignedInteger('rows_total')->default(0);
            $table->unsignedInteger('created_count')->default(0);
            $table->unsignedInteger('updated_count')->default(0);
            $table->unsignedInteger('errors_count')->default(0);
            $table->string('status', 20)->default('success');
            $table->timestamps();

            $table->index(['module', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spreadsheet_import_logs');
        Schema::dropIfExists('report_presets');
    }
};
