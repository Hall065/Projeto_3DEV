<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grid_users', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('hub_person_id')->nullable()->after('user_id')->constrained('hub_people')->nullOnDelete();
        });

        Schema::table('safe_students', function (Blueprint $table) {
            $table->foreignId('connect_student_id')->nullable()->after('id')->constrained('connect_students')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('safe_students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('connect_student_id');
        });

        Schema::table('grid_users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hub_person_id');
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
