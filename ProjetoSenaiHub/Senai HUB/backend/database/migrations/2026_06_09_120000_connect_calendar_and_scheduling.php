<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connect_courses', function (Blueprint $table): void {
            $table->date('start_date')->nullable()->after('workload_hours');
            $table->date('end_date')->nullable()->after('start_date');
        });

        Schema::table('connect_classes', function (Blueprint $table): void {
            $table->string('semester', 20)->nullable()->after('shift');
        });

        Schema::create('connect_class_weekly_patterns', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('connect_class_id')->constrained('connect_classes')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedTinyInteger('lessons_count')->default(4);
            $table->string('subject')->default('Aula regular');
            $table->timestamps();

            $table->unique(['connect_class_id', 'day_of_week', 'start_time'], 'class_weekly_pattern_unique');
        });

        Schema::create('connect_lesson_schedules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('connect_class_id')->constrained('connect_classes')->cascadeOnDelete();
            $table->foreignId('connect_teacher_id')->nullable()->constrained('connect_teachers')->nullOnDelete();
            $table->foreignId('connect_class_weekly_pattern_id')->nullable()->constrained('connect_class_weekly_patterns')->nullOnDelete();
            $table->date('scheduled_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('subject')->default('Aula regular');
            $table->unsignedTinyInteger('lessons_count')->default(4);
            $table->string('status', 20)->default('scheduled');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['connect_class_id', 'scheduled_date', 'start_time'], 'lesson_schedule_class_slot_unique');
            $table->index(['scheduled_date', 'status']);
        });

        Schema::table('connect_attendance_sessions', function (Blueprint $table): void {
            $table->foreignId('connect_lesson_schedule_id')
                ->nullable()
                ->after('connect_teacher_id')
                ->constrained('connect_lesson_schedules')
                ->nullOnDelete();
            $table->unique('connect_lesson_schedule_id');
        });
    }

    public function down(): void
    {
        Schema::table('connect_attendance_sessions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('connect_lesson_schedule_id');
        });

        Schema::dropIfExists('connect_lesson_schedules');
        Schema::dropIfExists('connect_class_weekly_patterns');

        Schema::table('connect_classes', function (Blueprint $table): void {
            $table->dropColumn('semester');
        });

        Schema::table('connect_courses', function (Blueprint $table): void {
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};
