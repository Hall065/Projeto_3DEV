<?php

namespace App\Services\Grid;

use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridInventoryReservation;
use App\Models\Grid\GridTask;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InventoryDuplicateService
{
    public function normalizeTitle(string $title): string
    {
        return mb_strtolower(trim($title));
    }

    public function normalizeSku(?string $sku): ?string
    {
        if (! filled($sku)) {
            return null;
        }

        return strtoupper(trim($sku));
    }

    public function findExisting(?string $sku, string $title): ?GridInventoryItem
    {
        $normalizedSku = $this->normalizeSku($sku);

        if ($normalizedSku !== null) {
            $match = GridInventoryItem::query()
                ->whereNotNull('sku')
                ->where('sku', '!=', '')
                ->get()
                ->first(fn (GridInventoryItem $item) => $this->normalizeSku($item->sku) === $normalizedSku);

            if ($match) {
                return $match;
            }
        }

        $normalizedTitle = $this->normalizeTitle($title);

        return GridInventoryItem::query()
            ->get()
            ->first(fn (GridInventoryItem $item) => $this->normalizeTitle($item->title) === $normalizedTitle);
    }

    /**
     * @param  array<string, mixed>  $incoming
     */
    public function mergeIncomingQuantity(GridInventoryItem $existing, array $incoming): GridInventoryItem
    {
        $addedQty = (int) ($incoming['qty_available'] ?? 0);
        $existing->qty_available += $addedQty;

        $this->fillMissingFields($existing, $incoming);

        if ($addedQty > 0 && blank($existing->qty_min) && filled($incoming['qty_min'] ?? null)) {
            $existing->qty_min = (int) $incoming['qty_min'];
        } elseif (filled($incoming['qty_min'] ?? null)) {
            $existing->qty_min = max($existing->qty_min, (int) $incoming['qty_min']);
        }

        $existing->refreshStockStatus();
        $existing->save();

        return $existing->fresh();
    }

    /**
     * @return list<array{canonical: GridInventoryItem, merged: list<GridInventoryItem>, qty_added: int}>
     */
    public function mergeAllDuplicates(): array
    {
        $items = GridInventoryItem::query()->orderBy('id')->get();
        $groups = $this->buildDuplicateGroups($items);
        $results = [];

        DB::transaction(function () use ($groups, &$results): void {
            foreach ($groups as $group) {
                $canonical = $this->pickCanonical($group);
                $merged = [];
                $qtyAdded = 0;

                foreach ($group as $duplicate) {
                    if ($duplicate->id === $canonical->id) {
                        continue;
                    }

                    $qtyAdded += $duplicate->qty_available;
                    $this->fillMissingFields($canonical, $duplicate->toArray());
                    $this->reassignReferences($duplicate->id, $canonical->id);
                    $merged[] = $duplicate;
                    $duplicate->delete();
                }

                if ($merged !== []) {
                    $canonical->qty_available += $qtyAdded;
                    $this->recalculateReserved($canonical);
                    $canonical->refreshStockStatus();
                    $canonical->save();

                    $results[] = [
                        'canonical' => $canonical->fresh(),
                        'merged' => $merged,
                        'qty_added' => $qtyAdded,
                    ];
                }
            }
        });

        return $results;
    }

    /**
     * @return list<Collection<int, GridInventoryItem>>
     */
    public function findDuplicateGroups(): array
    {
        $items = GridInventoryItem::query()->orderBy('id')->get();

        return $this->buildDuplicateGroups($items);
    }

    /**
     * @param  Collection<int, GridInventoryItem>  $items
     * @return list<Collection<int, GridInventoryItem>>
     */
    private function buildDuplicateGroups(Collection $items): array
    {
        $assigned = [];
        $groups = [];

        foreach ($items as $item) {
            if (isset($assigned[$item->id])) {
                continue;
            }

            $titleKey = $this->normalizeTitle($item->title);
            $skuKey = $this->normalizeSku($item->sku);

            $group = collect([$item]);
            $assigned[$item->id] = true;

            foreach ($items as $other) {
                if ($other->id === $item->id || isset($assigned[$other->id])) {
                    continue;
                }

                $sameTitle = $this->normalizeTitle($other->title) === $titleKey;
                $sameSku = $skuKey !== null
                    && $this->normalizeSku($other->sku) === $skuKey;

                if ($sameTitle || $sameSku) {
                    $group->push($other);
                    $assigned[$other->id] = true;
                }
            }

            if ($group->count() > 1) {
                $groups[] = $group;
            }
        }

        return $groups;
    }

    /**
     * @param  Collection<int, GridInventoryItem>  $group
     */
    private function pickCanonical(Collection $group): GridInventoryItem
    {
        return $group
            ->sortBy([
                fn (GridInventoryItem $item) => filled($item->sku) ? 0 : 1,
                fn (GridInventoryItem $item) => $item->id,
            ])
            ->first();
    }

    /**
     * @param  array<string, mixed>  $incoming
     */
    private function fillMissingFields(GridInventoryItem $existing, array $incoming): void
    {
        $fields = ['description', 'category', 'sku', 'location', 'supplier', 'purchased_at', 'image_url'];

        foreach ($fields as $field) {
            if (blank($existing->{$field}) && filled($incoming[$field] ?? null)) {
                $existing->{$field} = $incoming[$field];
            }
        }
    }

    private function reassignReferences(int $fromId, int $toId): void
    {
        GridInventoryReservation::query()
            ->where('grid_inventory_item_id', $fromId)
            ->orderBy('id')
            ->each(function (GridInventoryReservation $reservation) use ($toId): void {
                $existing = GridInventoryReservation::query()
                    ->where('grid_task_id', $reservation->grid_task_id)
                    ->where('grid_inventory_item_id', $toId)
                    ->where('status', $reservation->status)
                    ->first();

                if ($existing) {
                    $existing->quantity += $reservation->quantity;
                    $existing->save();
                    $reservation->delete();

                    return;
                }

                $reservation->update(['grid_inventory_item_id' => $toId]);
            });

        GridTask::query()
            ->whereNotNull('inventory_items')
            ->each(function (GridTask $task) use ($fromId, $toId): void {
                $items = $task->inventory_items ?? [];
                $changed = false;

                foreach ($items as &$row) {
                    if ((int) ($row['inventory_item_id'] ?? 0) !== $fromId) {
                        continue;
                    }

                    $row['inventory_item_id'] = $toId;
                    $changed = true;
                }
                unset($row);

                if ($changed) {
                    $task->update(['inventory_items' => $items]);
                }
            });
    }

    private function recalculateReserved(GridInventoryItem $item): void
    {
        $item->qty_reserved = (int) GridInventoryReservation::query()
            ->where('grid_inventory_item_id', $item->id)
            ->where('status', 'reserved')
            ->sum('quantity');
    }
}
