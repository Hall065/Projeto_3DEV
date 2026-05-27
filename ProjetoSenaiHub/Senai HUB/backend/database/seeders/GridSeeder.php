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
            ['title' => 'Mouse Óptico USB', 'category' => 'Informática', 'qty_available' => 42, 'qty_min' => 10, 'qty_reserved' => 0, 'cost' => 29.9],
            ['title' => 'Lâmpada LED 18W', 'category' => 'Elétrica', 'qty_available' => 3, 'qty_min' => 20, 'qty_reserved' => 6, 'cost' => 12.5],
            ['title' => 'Filtro de ar HVAC', 'category' => 'Climatização', 'qty_available' => 5, 'qty_min' => 15, 'qty_reserved' => 2, 'cost' => 89.0],
            ['title' => 'Cabo HDMI 2m', 'category' => 'Informática', 'qty_available' => 2, 'qty_min' => 10, 'qty_reserved' => 0, 'cost' => 35.0],
            ['title' => 'Selante silicone', 'category' => 'Hidráulica', 'qty_available' => 28, 'qty_min' => 8, 'qty_reserved' => 4, 'cost' => 18.5],
        ];

        $titleImages = config('inventory_images.title_fallbacks', []);
        $categoryImages = config('inventory_images.category_fallbacks', []);

        foreach ($inventoryItems as $item) {
            $record = GridInventoryItem::query()->updateOrCreate(
                ['title' => $item['title']],
                [
                    'description' => 'Item de estoque SENAI Grid.',
                    'category' => $item['category'],
                    'image_url' => $titleImages[$item['title']] ?? $categoryImages[$item['category']] ?? null,
                    'qty_available' => $item['qty_available'],
                    'qty_reserved' => $item['qty_reserved'],
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
            ['name' => 'Paulo Ferreira', 'email' => 'paulo.ferreira@senai.br', 'role' => 'Técnico de manutenção', 'phone' => '(11) 98765-1003'],
            ['name' => 'Carlos Mendes', 'email' => 'carlos.mendes.grid@senai.br', 'role' => 'Gerente de manutenção', 'phone' => '(11) 98765-4321'],
            ['name' => 'Ana Grid', 'email' => 'ana.grid@senai.local', 'role' => 'Administrador', 'phone' => '(11) 98765-2000'],
        ];

        foreach ($users as $user) {
            GridUser::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    ...$user,
                    'cpf' => '123.456.789-00',
                    'status' => 'active',
                ],
            );
        }
    }

}
