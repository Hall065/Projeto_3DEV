<?php

namespace Tests\Unit;

use App\Models\Grid\GridInventoryItem;
use App\Services\Grid\InventoryImageResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryImageResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_broken_url_is_detected(): void
    {
        $resolver = app(InventoryImageResolver::class);

        $this->assertTrue($resolver->isLegacyBrokenUrl(
            'https://upload.wikimedia.org/wikipedia/commons/9/97/Crystal_Project_mouse.png'
        ));
        $this->assertTrue($resolver->isLegacyBrokenUrl(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/512px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg'
        ));
        $this->assertFalse($resolver->isLegacyBrokenUrl(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg'
        ));
    }

    public function test_normalize_thumbnail_url_replaces_invalid_size(): void
    {
        $resolver = app(InventoryImageResolver::class);

        $normalized = $resolver->normalizeThumbnailUrl(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/HDMI_Cable_1.JPG/512px-HDMI_Cable_1.JPG'
        );

        $this->assertStringContainsString('/330px-', $normalized);
        $this->assertStringNotContainsString('/512px-', $normalized);
    }

    public function test_apply_quick_replaces_legacy_broken_url(): void
    {
        $resolver = app(InventoryImageResolver::class);

        $item = GridInventoryItem::query()->create([
            'title' => 'Mouse Óptico USB',
            'description' => 'Teste',
            'category' => 'Informática',
            'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/9/97/Crystal_Project_mouse.png',
            'qty_available' => 1,
            'qty_min' => 1,
            'location' => 'A',
            'supplier' => 'B',
            'cost' => 10,
            'status' => 'disponivel',
        ]);

        $url = $resolver->applyQuick($item);
        $item->refresh();

        $this->assertNotNull($url);
        $this->assertStringContainsString('/thumb/', $item->image_url);
        $this->assertStringNotContainsString('Crystal_Project_mouse.png', $item->image_url);
    }
}
