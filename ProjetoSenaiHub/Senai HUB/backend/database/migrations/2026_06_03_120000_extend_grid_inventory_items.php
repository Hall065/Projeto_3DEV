<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grid_inventory_items', function (Blueprint $table) {
            $table->date('purchased_at')->nullable()->after('supplier');
            $table->string('sku', 64)->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('grid_inventory_items', function (Blueprint $table) {
            $table->dropColumn(['purchased_at', 'sku']);
        });
    }
};
