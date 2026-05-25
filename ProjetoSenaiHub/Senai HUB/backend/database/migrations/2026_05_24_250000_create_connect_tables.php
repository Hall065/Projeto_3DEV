<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connect_courses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('workload_hours')->default(0);
            $table->string('area')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('connect_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('full_name');
            $table->string('cpf', 14)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('specialty')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('connect_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_course_id')->constrained('connect_courses')->cascadeOnDelete();
            $table->foreignId('connect_teacher_id')->nullable()->constrained('connect_teachers')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('shift')->default('manha');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('capacity')->default(30);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('connect_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('connect_class_id')->nullable()->constrained('connect_classes')->nullOnDelete();
            $table->string('full_name');
            $table->string('cpf', 14)->nullable();
            $table->string('registration_number')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['connect_class_id', 'status']);
            $table->index('full_name');
        });

        Schema::create('connect_attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_class_id')->constrained('connect_classes')->cascadeOnDelete();
            $table->foreignId('connect_teacher_id')->nullable()->constrained('connect_teachers')->nullOnDelete();
            $table->date('session_date');
            $table->string('subject')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();

            $table->unique(['connect_class_id', 'session_date', 'subject']);
        });

        Schema::create('connect_attendance_marks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_attendance_session_id')->constrained('connect_attendance_sessions')->cascadeOnDelete();
            $table->foreignId('connect_student_id')->constrained('connect_students')->cascadeOnDelete();
            $table->string('status')->default('present');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['connect_attendance_session_id', 'connect_student_id'], 'connect_attendance_marks_session_student_unique');
        });

        Schema::create('connect_activities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('general');
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('performed_by')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index('occurred_at');
        });

        Schema::create('connect_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->string('category')->default('cadastro');
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        Schema::create('connect_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_student_id')->constrained('connect_students')->cascadeOnDelete();
            $table->string('contract_type')->default('estagio');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('monthly_value', 10, 2)->default(0);
            $table->string('company_name')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('connect_salary_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_student_id')->constrained('connect_students')->cascadeOnDelete();
            $table->date('reference_month');
            $table->decimal('base_amount', 10, 2)->default(0);
            $table->decimal('deductions', 10, 2)->default(0);
            $table->decimal('bonuses', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2)->default(0);
            $table->string('status')->default('calculated');
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();

            $table->unique(['connect_student_id', 'reference_month'], 'connect_salary_student_month_unique');
        });

        Schema::create('connect_student_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_student_id')->unique()->constrained('connect_students')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state', 2)->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->string('status')->default('offline');
            $table->timestamps();
        });

        Schema::create('connect_dashboard_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connect_dashboard_metrics');
        Schema::dropIfExists('connect_student_locations');
        Schema::dropIfExists('connect_salary_records');
        Schema::dropIfExists('connect_contracts');
        Schema::dropIfExists('connect_alerts');
        Schema::dropIfExists('connect_activities');
        Schema::dropIfExists('connect_attendance_marks');
        Schema::dropIfExists('connect_attendance_sessions');
        Schema::dropIfExists('connect_students');
        Schema::dropIfExists('connect_classes');
        Schema::dropIfExists('connect_teachers');
        Schema::dropIfExists('connect_courses');
    }
};
