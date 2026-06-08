<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->json('notification_preferences')->nullable()->after('avatar_url');
        });

        Schema::create('hub_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('module', 20);
            $table->string('type', 80);
            $table->string('title');
            $table->text('message');
            $table->string('action_url', 500)->nullable();
            $table->string('entity_type', 60)->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('severity', 20)->default('info');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read', 'created_at']);
            $table->index(['module', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hub_notifications');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('notification_preferences');
        });
    }
};
