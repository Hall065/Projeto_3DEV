<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grid_ticket_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grid_ticket_id')->constrained('grid_tickets')->cascadeOnDelete();
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('original_name');
            $table->string('mime_type', 120);
            $table->unsignedInteger('size_bytes');
            $table->string('disk_path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grid_ticket_attachments');
    }
};
