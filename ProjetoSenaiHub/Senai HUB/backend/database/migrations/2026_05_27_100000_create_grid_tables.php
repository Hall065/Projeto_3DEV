<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grid_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('requester');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->string('room')->nullable();
            $table->string('block', 10)->nullable();
            $table->string('priority')->default('media');
            $table->string('status')->default('aberto');
            $table->string('assignee')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
            $table->index('opened_at');
            $table->index('title');
        });

        Schema::create('grid_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grid_ticket_id')->nullable()->constrained('grid_tickets')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('opened_by');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('room')->nullable();
            $table->string('block', 10)->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->string('assignee')->nullable();
            $table->json('items')->nullable();
            $table->string('priority')->default('media');
            $table->string('column')->default('a_fazer');
            $table->string('status_label')->nullable();
            $table->timestamps();

            $table->index('column');
        });

        Schema::create('grid_inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->unsignedInteger('qty_available')->default(0);
            $table->unsignedInteger('qty_min')->default(0);
            $table->string('location')->nullable();
            $table->string('supplier')->nullable();
            $table->decimal('cost', 12, 2)->default(0);
            $table->string('status')->default('disponivel');
            $table->timestamps();

            $table->index(['category', 'status']);
            $table->index('title');
        });

        Schema::create('grid_users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('role');
            $table->string('cpf', 14)->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['role', 'status']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grid_tasks');
        Schema::dropIfExists('grid_inventory_items');
        Schema::dropIfExists('grid_users');
        Schema::dropIfExists('grid_tickets');
    }
};
