<?php

namespace App\Console\Commands;

use App\Models\Grid\GridInventoryItem;
use App\Services\Grid\InventoryImageResolver;
use Illuminate\Console\Command;

class SyncGridInventoryImages extends Command
{
    protected $signature = 'grid:sync-inventory-images {--force : Substitui imagens já definidas}';

    protected $description = 'Busca imagens públicas (Wikimedia Commons) para itens do estoque Grid';

    public function handle(InventoryImageResolver $resolver): int
    {
        $force = (bool) $this->option('force');
        $items = GridInventoryItem::query()->orderBy('id')->get();

        if ($items->isEmpty()) {
            $this->warn('Nenhum item de estoque encontrado.');

            return self::SUCCESS;
        }

        $this->info('Sincronizando imagens de '.$items->count().' itens...');

        $updated = 0;
        foreach ($items as $item) {
            if (! $force && filled($item->image_url)) {
                $this->line("  [skip] {$item->title}");
                continue;
            }

            $url = $resolver->apply($item, $force);
            if ($url) {
                $updated++;
                $this->line("  [ok] {$item->title}");
            } else {
                $this->line("  [--] {$item->title} (sem imagem encontrada)");
            }
        }

        $this->newLine();
        $this->info("Concluído: {$updated} item(ns) com imagem.");

        return self::SUCCESS;
    }
}
