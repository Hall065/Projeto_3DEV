<?php

namespace App\Http\Controllers\Api\Grid;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grid\UploadInventoryImageRequest;
use App\Http\Resources\Grid\GridInventoryItemDetailResource;
use App\Http\Resources\Grid\GridInventoryItemResource;
use App\Models\Grid\GridInventoryItem;
use App\Services\Grid\InventoryDuplicateService;
use App\Services\Grid\InventoryImageResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    public function __construct(
        private InventoryImageResolver $images,
        private InventoryDuplicateService $duplicates,
    ) {}
    public function index(Request $request): JsonResponse
    {
        $query = GridInventoryItem::query()->orderBy('title');

        $query->search($request->string('search')->trim()->toString() ?: null);

        if ($request->filled('category')) {
            $query->where('category', $request->string('category')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $items = $query->paginate($request->integer('per_page', 8));

        $items->getCollection()->each(function (GridInventoryItem $item): void {
            $this->ensureItemImage($item);
        });

        return GridInventoryItemResource::collection($items)->response();
    }

    public function show(GridInventoryItem $inventoryItem): JsonResponse
    {
        $this->ensureItemImage($inventoryItem);
        $inventoryItem->refresh();

        return response()->json([
            'data' => new GridInventoryItemDetailResource($inventoryItem),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'qty_available' => ['nullable', 'integer', 'min:0'],
            'qty_min' => ['nullable', 'integer', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(['disponivel', 'baixo', 'reservado'])],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'sku' => ['nullable', 'string', 'max:64'],
            'purchased_at' => ['nullable', 'date'],
        ]);

        $existing = $this->duplicates->findExisting($validated['sku'] ?? null, $validated['title']);

        if ($existing) {
            $addedQty = (int) ($validated['qty_available'] ?? 0);
            $item = $this->duplicates->mergeIncomingQuantity($existing, $validated);

            if (empty($item->image_url)) {
                if (! empty($validated['image_url'])) {
                    $item->update(['image_url' => $validated['image_url']]);
                } else {
                    $this->images->applyQuick($item);
                }
                $item->refresh();
            }

            return response()->json([
                'data' => new GridInventoryItemResource($item),
                'message' => "Item já existente no estoque. Quantidade somada (+{$addedQty}). Total disponível: {$item->qty_available}.",
                'merged' => true,
            ]);
        }

        $item = GridInventoryItem::query()->create([
            ...$validated,
            'qty_available' => $validated['qty_available'] ?? 0,
            'qty_min' => $validated['qty_min'] ?? 0,
            'cost' => $validated['cost'] ?? 0,
            'status' => $validated['status'] ?? 'disponivel',
        ]);

        $item->refreshStockStatus();
        $item->save();

        if (empty($item->image_url)) {
            $this->images->applyQuick($item);
            $item->refresh();
        }

        return response()->json([
            'data' => new GridInventoryItemResource($item),
            'message' => 'Item cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, GridInventoryItem $inventoryItem): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'qty_available' => ['nullable', 'integer', 'min:0'],
            'qty_min' => ['nullable', 'integer', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(['disponivel', 'baixo', 'reservado'])],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'sku' => ['nullable', 'string', 'max:64'],
            'purchased_at' => ['nullable', 'date'],
        ]);

        $inventoryItem->update($validated);
        $inventoryItem->refreshStockStatus();
        $inventoryItem->save();

        return response()->json([
            'data' => new GridInventoryItemResource($inventoryItem->fresh()),
            'message' => 'Item atualizado com sucesso.',
        ]);
    }

    public function adjust(Request $request, GridInventoryItem $inventoryItem): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['in', 'out'])],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        if ($validated['type'] === 'in') {
            $inventoryItem->qty_available += $validated['quantity'];
        } else {
            $inventoryItem->qty_available = max(0, $inventoryItem->qty_available - $validated['quantity']);
        }

        $inventoryItem->refreshStockStatus();
        $inventoryItem->save();

        return response()->json([
            'data' => new GridInventoryItemResource($inventoryItem),
            'message' => $validated['type'] === 'in' ? 'Entrada registrada.' : 'Saída registrada.',
        ]);
    }

    public function syncImage(GridInventoryItem $inventoryItem): JsonResponse
    {
        $url = $this->images->apply($inventoryItem, force: true);

        return response()->json([
            'data' => new GridInventoryItemResource($inventoryItem->fresh()),
            'message' => $url ? 'Imagem atualizada a partir do Wikimedia Commons.' : 'Nenhuma imagem encontrada para este item.',
        ]);
    }

    public function uploadImage(UploadInventoryImageRequest $request, GridInventoryItem $inventoryItem): JsonResponse
    {
        $this->images->storeUpload($inventoryItem, $request->file('image'));

        return response()->json([
            'data' => new GridInventoryItemResource($inventoryItem->fresh()),
            'message' => 'Imagem do item atualizada.',
        ]);
    }

    public function destroy(GridInventoryItem $inventoryItem): JsonResponse
    {
        $inventoryItem->delete();

        return response()->json(['message' => 'Item excluído com sucesso.']);
    }

    private function ensureItemImage(GridInventoryItem $item): void
    {
        $url = $item->image_url;

        if ($this->images->isStoredUpload($url)) {
            return;
        }

        if (blank($url) || $this->images->isLegacyBrokenUrl($url)) {
            $this->images->applyQuick($item);

            return;
        }

        $normalized = $this->images->normalizeThumbnailUrl($url);
        if ($normalized !== $url) {
            $item->update(['image_url' => $normalized]);
        }
    }
}
