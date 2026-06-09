<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grid_tickets', function (Blueprint $table): void {
            $table->foreignId('requester_user_id')->nullable()->after('requester')->constrained('users')->nullOnDelete();
            $table->foreignId('assignee_user_id')->nullable()->after('assignee')->constrained('users')->nullOnDelete();
        });

        Schema::table('grid_tasks', function (Blueprint $table): void {
            $table->foreignId('opened_by_user_id')->nullable()->after('opened_by')->constrained('users')->nullOnDelete();
            $table->foreignId('assignee_user_id')->nullable()->after('assignee')->constrained('users')->nullOnDelete();
        });

        $this->backfillUserIds();
    }

    public function down(): void
    {
        Schema::table('grid_tasks', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('assignee_user_id');
            $table->dropConstrainedForeignId('opened_by_user_id');
        });

        Schema::table('grid_tickets', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('assignee_user_id');
            $table->dropConstrainedForeignId('requester_user_id');
        });
    }

    private function backfillUserIds(): void
    {
        $usersByName = DB::table('users')->pluck('id', 'name');

        DB::table('grid_tickets')->orderBy('id')->lazyById()->each(function ($ticket) use ($usersByName): void {
            DB::table('grid_tickets')->where('id', $ticket->id)->update([
                'requester_user_id' => $usersByName[$ticket->requester] ?? null,
                'assignee_user_id' => filled($ticket->assignee) ? ($usersByName[$ticket->assignee] ?? null) : null,
            ]);
        });

        DB::table('grid_tasks')->orderBy('id')->lazyById()->each(function ($task) use ($usersByName): void {
            DB::table('grid_tasks')->where('id', $task->id)->update([
                'opened_by_user_id' => $usersByName[$task->opened_by] ?? null,
                'assignee_user_id' => filled($task->assignee) ? ($usersByName[$task->assignee] ?? null) : null,
            ]);
        });
    }
};
