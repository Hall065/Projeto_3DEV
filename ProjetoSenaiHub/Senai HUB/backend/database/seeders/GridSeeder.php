<?php

namespace Database\Seeders;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridUser;
use Illuminate\Database\Seeder;

class GridSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryItems = [
            ['title' => 'Mouse Óptico USB', 'sku' => 'INF-MOU-001', 'category' => 'Informática', 'qty_available' => 42, 'qty_min' => 10, 'qty_reserved' => 0, 'cost' => 29.9, 'purchased_at' => '2024-03-15'],
            ['title' => 'Lâmpada LED 18W', 'sku' => 'ELE-LMP-018', 'category' => 'Elétrica', 'qty_available' => 18, 'qty_min' => 20, 'qty_reserved' => 0, 'cost' => 12.5, 'purchased_at' => '2025-01-08'],
            ['title' => 'Filtro de ar HVAC', 'sku' => 'CLI-FIL-HVAC', 'category' => 'Climatização', 'qty_available' => 12, 'qty_min' => 15, 'qty_reserved' => 0, 'cost' => 89.0, 'purchased_at' => '2023-11-22'],
            ['title' => 'Cabo HDMI 2m', 'sku' => 'INF-HDM-2M', 'category' => 'Informática', 'qty_available' => 25, 'qty_min' => 10, 'qty_reserved' => 0, 'cost' => 35.0, 'purchased_at' => '2025-06-01'],
            ['title' => 'Selante silicone', 'sku' => 'HID-SEL-280', 'category' => 'Hidráulica', 'qty_available' => 28, 'qty_min' => 8, 'qty_reserved' => 0, 'cost' => 18.5, 'purchased_at' => '2024-09-30'],
            ['title' => 'Disjuntor bipolar 20A', 'sku' => 'ELE-DIS-20A', 'category' => 'Elétrica', 'qty_available' => 14, 'qty_min' => 6, 'qty_reserved' => 0, 'cost' => 45.0, 'purchased_at' => '2024-05-10'],
            ['title' => 'Ventilador de teto 120cm', 'sku' => 'CLI-VEN-120', 'category' => 'Climatização', 'qty_available' => 6, 'qty_min' => 3, 'qty_reserved' => 0, 'cost' => 220.0, 'purchased_at' => '2024-08-01'],
            ['title' => 'Tinta látex branca 18L', 'sku' => 'HID-TIN-18L', 'category' => 'Hidráulica', 'qty_available' => 9, 'qty_min' => 4, 'qty_reserved' => 0, 'cost' => 165.0, 'purchased_at' => '2025-02-14'],
            ['title' => 'Parafuso philips 6mm (cx)', 'sku' => 'HID-PAR-6MM', 'category' => 'Hidráulica', 'qty_available' => 40, 'qty_min' => 12, 'qty_reserved' => 0, 'cost' => 22.0, 'purchased_at' => '2024-11-05'],
            ['title' => 'Tomada 2P+T 10A', 'sku' => 'ELE-TOM-10A', 'category' => 'Elétrica', 'qty_available' => 30, 'qty_min' => 10, 'qty_reserved' => 0, 'cost' => 8.5, 'purchased_at' => '2025-03-20'],
        ];

        $titleImages = config('inventory_images.title_fallbacks', []);
        $categoryImages = config('inventory_images.category_fallbacks', []);

        foreach ($inventoryItems as $item) {
            $record = GridInventoryItem::query()->updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'title' => $item['title'],
                    'description' => 'Item de estoque SENAI Grid.',
                    'category' => $item['category'],
                    'purchased_at' => $item['purchased_at'] ?? null,
                    'image_url' => $titleImages[$item['title']] ?? $categoryImages[$item['category']] ?? null,
                    'qty_available' => $item['qty_available'],
                    'qty_reserved' => 0,
                    'qty_min' => $item['qty_min'],
                    'location' => 'Almoxarifado - Bloco A',
                    'supplier' => 'TechSupply Ltda',
                    'cost' => $item['cost'],
                    'status' => 'disponivel',
                ],
            );
            $record->refreshStockStatus();
            $record->save();
        }

        $users = [
            ['name' => 'Júlio Oliveira', 'email' => 'julio.oliveira@senai.br', 'role' => 'Técnico de manutenção', 'phone' => '(11) 98765-1001'],
            ['name' => 'Maria Santos', 'email' => 'maria.santos@senai.br', 'role' => 'Técnico de manutenção', 'phone' => '(11) 98765-1002'],
            ['name' => 'Carlos Mendes', 'email' => 'carlos.mendes.grid@senai.br', 'role' => 'Gerente de manutenção', 'phone' => '(11) 98765-4321'],
            ['name' => 'Roberto Alves', 'email' => 'roberto.alves.grid@senai.br', 'role' => 'Gerente de manutenção', 'phone' => '(11) 98765-4322'],
            ['name' => 'Ana Grid', 'email' => 'ana.grid@senai.local', 'role' => 'Administrador', 'phone' => '(11) 98765-2000'],
        ];

        foreach ($users as $index => $user) {
            GridUser::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    ...$user,
                    'cpf' => sprintf('123.456.789-%02d', $index + 1),
                    'status' => 'active',
                ],
            );
        }
    }
}
