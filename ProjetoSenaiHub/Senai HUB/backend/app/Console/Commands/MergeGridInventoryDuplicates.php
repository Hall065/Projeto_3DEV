<?php

namespace App\Console\Commands;

use App\Services\Grid\InventoryDuplicateService;
use Illuminate\Console\Command;

class MergeGridInventoryDuplicates extends Command
{
    protected $signature = 'grid:merge-inventory-duplicates {--dry-run : Apenas lista duplicatas, sem alterar o banco}';

    protected $description = 'Mescla itens duplicados do estoque Grid (mesmo titulo ou SKU) somando quantidades';

    public function handle(InventoryDuplicateService $duplicates): int
    {
        $groups = $duplicates->findDuplicateGroups();

        if ($groups === []) {
            $this->info('Nenhuma duplicata encontrada.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->warn('Duplicatas encontradas: '.count($groups));

            foreach ($groups as $group) {
                $titles = $group->pluck('title')->unique()->join(' / ');
                $ids = $group->pluck('id')->join(', ');
                $this->line("  [{$ids}] {$titles}");
            }

            return self::SUCCESS;
        }

        $results = $duplicates->mergeAllDuplicates();

        foreach ($results as $result) {
            $mergedIds = collect($result['merged'])->pluck('id')->join(', ');
            $this->line(sprintf(
                '  [ok] #%d "%s" — mesclou ids %s (+%d un.) — total: %d',
                $result['canonical']->id,
                $result['canonical']->title,
                $mergedIds,
                $result['qty_added'],
                $result['canonical']->qty_available,
            ));
        }

        $this->newLine();
        $this->info('Concluido: '.count($results).' grupo(s) mesclado(s).');

        return self::SUCCESS;
    }
}
