<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hub_people', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 32); // student | teacher | staff | other
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('full_name');
            $table->string('cpf', 14)->nullable();
            $table->string('registration_number')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('specialty')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['kind', 'status']);
            $table->index('full_name');
            $table->index('email');
        });

        Schema::create('connect_course_hub_person', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_course_id')->constrained('connect_courses')->cascadeOnDelete();
            $table->foreignId('hub_person_id')->constrained('hub_people')->cascadeOnDelete();
            $table->string('role', 32); // student | teacher | coordinator
            $table->string('status')->default('active');
            $table->date('enrolled_at')->nullable();
            $table->timestamps();

            $table->unique(['connect_course_id', 'hub_person_id', 'role'], 'connect_course_hub_person_unique');
        });

        Schema::create('connect_class_hub_person', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connect_class_id')->constrained('connect_classes')->cascadeOnDelete();
            $table->foreignId('hub_person_id')->constrained('hub_people')->cascadeOnDelete();
            $table->string('role', 32)->default('student');
            $table->string('status')->default('active');
            $table->date('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['connect_class_id', 'hub_person_id'], 'connect_class_hub_person_unique');
        });

        Schema::table('connect_teachers', function (Blueprint $table) {
            $table->foreignId('hub_person_id')->nullable()->constrained('hub_people')->nullOnDelete();
        });

        Schema::table('connect_students', function (Blueprint $table) {
            $table->foreignId('hub_person_id')->nullable()->constrained('hub_people')->nullOnDelete();
        });

        $this->backfillHubPeopleAndLinks();
    }

    private function backfillHubPeopleAndLinks(): void
    {
        if (! Schema::hasTable('connect_teachers')) {
            return;
        }

        $now = now();

        $teachers = DB::table('connect_teachers')->whereNull('hub_person_id')->get();
        foreach ($teachers as $t) {
            $pid = DB::table('hub_people')->insertGetId([
                'kind' => 'teacher',
                'user_id' => $t->user_id,
                'full_name' => $t->full_name,
                'cpf' => $t->cpf,
                'registration_number' => null,
                'email' => $t->email,
                'phone' => $t->phone,
                'birth_date' => null,
                'specialty' => $t->specialty,
                'metadata' => null,
                'status' => $t->status ?? 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('connect_teachers')->where('id', $t->id)->update(['hub_person_id' => $pid]);
        }

        $students = DB::table('connect_students')->whereNull('hub_person_id')->get();
        foreach ($students as $s) {
            $pid = DB::table('hub_people')->insertGetId([
                'kind' => 'student',
                'user_id' => $s->user_id,
                'full_name' => $s->full_name,
                'cpf' => $s->cpf,
                'email' => $s->email,
                'phone' => $s->phone,
                'birth_date' => $s->birth_date,
                'specialty' => null,
                'registration_number' => $s->registration_number,
                'metadata' => null,
                'status' => $s->status ?? 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('connect_students')->where('id', $s->id)->update(['hub_person_id' => $pid]);
        }

        // Professores vinculados ao curso (via turmas)
        $classRows = DB::table('connect_classes')
            ->join('connect_teachers', 'connect_classes.connect_teacher_id', '=', 'connect_teachers.id')
            ->whereNotNull('connect_classes.connect_teacher_id')
            ->select(
                'connect_classes.connect_course_id',
                'connect_teachers.hub_person_id as hub_person_id',
            )
            ->distinct()
            ->get();

        foreach ($classRows as $row) {
            if (! $row->hub_person_id) {
                continue;
            }
            DB::table('connect_course_hub_person')->insertOrIgnore([
                'connect_course_id' => $row->connect_course_id,
                'hub_person_id' => $row->hub_person_id,
                'role' => 'teacher',
                'status' => 'active',
                'enrolled_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Alunos no curso e na turma
        $studentRows = DB::table('connect_students')
            ->join('connect_classes', 'connect_students.connect_class_id', '=', 'connect_classes.id')
            ->whereNotNull('connect_students.connect_class_id')
            ->whereNotNull('connect_students.hub_person_id')
            ->select(
                'connect_classes.id as class_id',
                'connect_classes.connect_course_id',
                'connect_students.hub_person_id',
            )
            ->get();

        foreach ($studentRows as $row) {
            DB::table('connect_course_hub_person')->insertOrIgnore([
                'connect_course_id' => $row->connect_course_id,
                'hub_person_id' => $row->hub_person_id,
                'role' => 'student',
                'status' => 'active',
                'enrolled_at' => $now->toDateString(),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('connect_class_hub_person')->insertOrIgnore([
                'connect_class_id' => $row->class_id,
                'hub_person_id' => $row->hub_person_id,
                'role' => 'student',
                'status' => 'active',
                'joined_at' => $now->toDateString(),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('connect_students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hub_person_id');
        });

        Schema::table('connect_teachers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hub_person_id');
        });

        Schema::dropIfExists('connect_class_hub_person');
        Schema::dropIfExists('connect_course_hub_person');
        Schema::dropIfExists('hub_people');
    }
};
