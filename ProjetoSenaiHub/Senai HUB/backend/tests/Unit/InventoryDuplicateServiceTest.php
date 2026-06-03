<?php

namespace Tests\Unit;

use App\Models\Grid\GridInventoryItem;
use App\Services\Grid\InventoryDuplicateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryDuplicateServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_find_existing_by_sku(): void
    {
        GridInventoryItem::query()->create([
            'title' => 'Mouse USB',
            'sku' => 'INF-MOU-001',
            'qty_available' => 10,
            'qty_min' => 2,
            'status' => 'disponivel',
        ]);

        $service = app(InventoryDuplicateService::class);

        $match = $service->findExisting('inf-mou-001', 'Outro nome');

        $this->assertNotNull($match);
        $this->assertSame('INF-MOU-001', $match->sku);
    }

    public function test_find_existing_by_title_when_sku_missing(): void
    {
        GridInventoryItem::query()->create([
            'title' => 'Lâmpada LED 18W',
            'sku' => null,
            'qty_available' => 5,
            'qty_min' => 1,
            'status' => 'disponivel',
        ]);

        $service = app(InventoryDuplicateService::class);

        $match = $service->findExisting(null, 'Lâmpada LED 18W');

        $this->assertNotNull($match);
    }

    public function test_merge_incoming_quantity_sums_stock(): void
    {
        $existing = GridInventoryItem::query()->create([
            'title' => 'Cabo HDMI',
            'sku' => 'INF-HDM-2M',
            'qty_available' => 20,
            'qty_min' => 5,
            'status' => 'disponivel',
        ]);

        $service = app(InventoryDuplicateService::class);

        $updated = $service->mergeIncomingQuantity($existing, [
            'title' => 'Cabo HDMI 2m',
            'qty_available' => 7,
            'qty_min' => 10,
        ]);

        $this->assertSame(27, $updated->qty_available);
        $this->assertSame(10, $updated->qty_min);
    }
}
