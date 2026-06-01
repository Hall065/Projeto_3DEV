<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('connect_classes', function (Blueprint $table) {
            $table->unsignedTinyInteger('default_lessons_per_day')->default(4)->after('capacity');
            $table->unsignedSmallInteger('max_absences_allowed')->nullable()->after('default_lessons_per_day');
        });

        Schema::table('connect_students', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_absences_allowed')->nullable()->after('status');
        });

        Schema::table('connect_attendance_sessions', function (Blueprint $table) {
            $table->unsignedTinyInteger('lessons_count')->default(4)->after('subject');
        });

        Schema::table('connect_attendance_marks', function (Blueprint $table) {
            $table->unsignedTinyInteger('missed_lessons')->default(0)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('connect_attendance_marks', function (Blueprint $table) {
            $table->dropColumn('missed_lessons');
        });

        Schema::table('connect_attendance_sessions', function (Blueprint $table) {
            $table->dropColumn('lessons_count');
        });

        Schema::table('connect_students', function (Blueprint $table) {
            $table->dropColumn('max_absences_allowed');
        });

        Schema::table('connect_classes', function (Blueprint $table) {
            $table->dropColumn(['default_lessons_per_day', 'max_absences_allowed']);
        });
    }
};
