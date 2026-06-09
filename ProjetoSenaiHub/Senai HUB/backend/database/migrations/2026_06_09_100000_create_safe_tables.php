<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('safe_students', function (Blueprint $table) {
            $table->id();
            $table->string('registration')->unique();
            $table->string('name');
            $table->string('class_name');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['class_name', 'active']);
            $table->index('name');
        });

        Schema::create('safe_authorizations', function (Blueprint $table) {
            $table->id();
            $table->string('protocol')->unique();

            $table->foreignId('safe_student_id')->nullable()->constrained('safe_students')->nullOnDelete();
            $table->string('student_name');
            $table->string('class_name');

            $table->string('type');
            $table->text('reason');
            $table->unsignedTinyInteger('absence_count')->nullable();
            $table->dateTime('scheduled_at');
            $table->text('notes')->nullable();

            $table->string('status')->default('pendente_aqv');

            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by_teacher')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_portaria')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('teacher_approved_at')->nullable();
            $table->timestamp('portaria_confirmed_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index('scheduled_at');
            $table->index('created_at');
        });

        Schema::create('safe_authorization_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('safe_authorization_id')->constrained('safe_authorizations')->cascadeOnDelete();
            $table->string('action');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('safe_authorization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('safe_authorization_logs');
        Schema::dropIfExists('safe_authorizations');
        Schema::dropIfExists('safe_students');
    }
};
