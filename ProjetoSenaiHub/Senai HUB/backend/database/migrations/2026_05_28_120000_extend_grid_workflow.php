<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grid_tickets', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('opened_at');
            $table->timestamp('completed_at')->nullable()->after('started_at');
            $table->text('resolution_summary')->nullable();
            $table->text('fixed_description')->nullable();
            $table->text('considerations')->nullable();
            $table->unsignedTinyInteger('evaluation_rating')->nullable();
            $table->text('evaluation_notes')->nullable();
            $table->string('evaluated_by')->nullable();
            $table->timestamp('evaluated_at')->nullable();
        });

        Schema::table('grid_tasks', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('opened_at');
            $table->json('inventory_items')->nullable()->after('items');
        });

        Schema::table('grid_inventory_items', function (Blueprint $table) {
            $table->unsignedInteger('qty_reserved')->default(0)->after('qty_available');
        });

        Schema::create('grid_inventory_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grid_task_id')->constrained('grid_tasks')->cascadeOnDelete();
            $table->foreignId('grid_ticket_id')->nullable()->constrained('grid_tickets')->nullOnDelete();
            $table->foreignId('grid_inventory_item_id')->constrained('grid_inventory_items')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('status')->default('reserved');
            $table->timestamps();

            $table->index(['grid_task_id', 'status']);
            $table->index(['grid_inventory_item_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grid_inventory_reservations');

        Schema::table('grid_inventory_items', function (Blueprint $table) {
            $table->dropColumn('qty_reserved');
        });

        Schema::table('grid_tasks', function (Blueprint $table) {
            $table->dropColumn(['completed_at', 'inventory_items']);
        });

        Schema::table('grid_tickets', function (Blueprint $table) {
            $table->dropColumn([
                'started_at',
                'completed_at',
                'resolution_summary',
                'fixed_description',
                'considerations',
                'evaluation_rating',
                'evaluation_notes',
                'evaluated_by',
                'evaluated_at',
            ]);
        });
    }
};
