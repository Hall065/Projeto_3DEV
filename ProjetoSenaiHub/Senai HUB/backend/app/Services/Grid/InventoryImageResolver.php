<?php

namespace App\Services\Grid;

use App\Models\Grid\GridInventoryItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InventoryImageResolver
{
    private const API = 'https://commons.wikimedia.org/w/api.php';

    /**
     * Resolve URL pública (Wikimedia Commons) para o item.
     */
    public function resolve(GridInventoryItem $item): ?string
    {
        $static = $this->staticFallback($item);
        if ($static) {
            return $static;
        }

        foreach ($this->searchQueries($item) as $query) {
            $url = $this->searchCommons($query);
            if ($url) {
                return $url;
            }
            usleep(250_000);
        }

        return $this->categoryFallback($item->category);
    }

    public function apply(GridInventoryItem $item, bool $force = false): ?string
    {
        if (! $force && filled($item->image_url) && ! $this->isLegacyBrokenUrl($item->image_url)) {
            return $item->image_url;
        }

        if ($force) {
            $this->deleteStoredUpload($item);
        }

        $url = $this->resolve($item) ?? $this->resolveQuick($item);
        if ($url) {
            $item->update(['image_url' => $url]);
        }

        return $url;
    }

    /**
     * Fallback imediato (sem HTTP) — usado na listagem e ao cadastrar.
     */
    public function storeUpload(GridInventoryItem $item, UploadedFile $file): string
    {
        $this->deleteStoredUpload($item);

        $path = $file->store('inventory/'.$item->id, 'public');
        $url = Storage::disk('public')->url($path);

        $item->update(['image_url' => $url]);

        return $url;
    }

    public function isStoredUpload(?string $url): bool
    {
        if (! filled($url)) {
            return false;
        }

        $publicBase = rtrim(Storage::disk('public')->url(''), '/').'/';

        if (! str_starts_with($url, $publicBase)) {
            return false;
        }

        $relativePath = ltrim(substr($url, strlen($publicBase)), '/');

        return str_starts_with($relativePath, 'inventory/');
    }

    public function deleteStoredUpload(GridInventoryItem $item): void
    {
        $imageUrl = $item->image_url;

        if (! $this->isStoredUpload($imageUrl)) {
            return;
        }

        $publicBase = rtrim(Storage::disk('public')->url(''), '/').'/';
        $relativePath = ltrim(substr($imageUrl, strlen($publicBase)), '/');

        if ($relativePath !== '') {
            Storage::disk('public')->delete($relativePath);
        }
    }

    public function applyQuick(GridInventoryItem $item, bool $persist = true): ?string
    {
        if (filled($item->image_url) && ! $this->isLegacyBrokenUrl($item->image_url)) {
            return $item->image_url;
        }

        $url = $this->resolveQuick($item);
        if ($url && $persist) {
            $item->update(['image_url' => $url]);
        }

        return $url;
    }

    public function isLegacyBrokenUrl(string $url): bool
    {
        foreach (config('inventory_images.legacy_broken_url_fragments', []) as $fragment) {
            if (str_contains($url, $fragment)) {
                return true;
            }
        }

        if (str_contains($url, '/512px-')) {
            return true;
        }

        if (str_contains($url, 'upload.wikimedia.org/wikipedia/commons/')
            && ! str_contains($url, '/thumb/')) {
            return true;
        }

        return false;
    }

    /**
     * Wikimedia só aceita tamanhos padronizados (330px, 500px, etc.) — 512px retorna HTTP 400.
     */
    public function normalizeThumbnailUrl(string $url): string
    {
        if (str_contains($url, '/512px-')) {
            return str_replace('/512px-', '/330px-', $url);
        }

        return $url;
    }

    public function publicImageUrl(?string $url): ?string
    {
        if (! filled($url)) {
            return null;
        }

        if ($this->isLegacyBrokenUrl($url)) {
            return null;
        }

        return $this->normalizeThumbnailUrl($url);
    }

    public function resolveQuick(GridInventoryItem $item): ?string
    {
        $static = $this->staticFallback($item);
        if ($static) {
            return $static;
        }

        $lower = Str::lower($item->title);
        foreach (config('inventory_images.keyword_fallbacks', []) as $keyword => $url) {
            if (str_contains($lower, $keyword)) {
                return $url;
            }
        }

        return config('inventory_images.default_fallback');
    }

    /**
     * @return list<string>
     */
    private function searchQueries(GridInventoryItem $item): array
    {
        $queries = [];
        $map = config('inventory_images.search_terms', []);
        if (isset($map[$item->title])) {
            $queries[] = $map[$item->title];
        }

        $queries[] = $item->title.' '.$item->category;
        $queries[] = $this->englishHint($item->title);

        $catTerms = config('inventory_images.category_terms', []);
        if ($item->category && isset($catTerms[$item->category])) {
            $queries[] = $catTerms[$item->category];
        }

        return array_values(array_unique(array_filter($queries)));
    }

    private function englishHint(string $title): string
    {
        $lower = Str::lower($title);
        $hints = [
            'mouse' => 'computer mouse',
            'lâmpada' => 'light bulb LED',
            'lampada' => 'light bulb LED',
            'filtro' => 'air filter',
            'hdmi' => 'HDMI cable',
            'selante' => 'silicone sealant',
            'cabo' => 'electric cable',
            'tomada' => 'power outlet',
            'disjuntor' => 'circuit breaker',
            'tinta' => 'paint bucket',
            'parafuso' => 'screw hardware',
        ];

        foreach ($hints as $pt => $en) {
            if (str_contains($lower, $pt)) {
                return $en;
            }
        }

        return $title;
    }

    private function staticFallback(GridInventoryItem $item): ?string
    {
        $byTitle = config('inventory_images.title_fallbacks', []);

        return $byTitle[$item->title] ?? $this->categoryFallback($item->category);
    }

    private function categoryFallback(?string $category): ?string
    {
        if (! $category) {
            return null;
        }

        $map = config('inventory_images.category_fallbacks', []);

        return $map[$category] ?? null;
    }

    private function searchCommons(string $query): ?string
    {
        try {
            $response = Http::timeout(12)
                ->withHeaders(['User-Agent' => config('inventory_images.user_agent')])
                ->get(self::API, [
                    'action' => 'query',
                    'format' => 'json',
                    'generator' => 'search',
                    'gsrsearch' => 'filetype:bitmap '.$query,
                    'gsrlimit' => 8,
                    'gsrnamespace' => 6,
                    'prop' => 'imageinfo',
                    'iiprop' => 'url|mime|thumburl',
                    'iiurlwidth' => 330,
                ]);

            if (! $response->successful()) {
                return null;
            }

            $pages = $response->json('query.pages') ?? [];
            if (! is_array($pages)) {
                return null;
            }

            $pngFirst = null;
            $any = null;

            foreach ($pages as $page) {
                $info = $page['imageinfo'][0] ?? null;
                if (! is_array($info)) {
                    continue;
                }

                $url = $info['thumburl'] ?? $info['url'] ?? null;
                if (! is_string($url) || $url === '') {
                    continue;
                }

                $mime = $info['mime'] ?? '';
                if ($mime === 'image/png') {
                    return $url;
                }

                $pngFirst ??= str_ends_with(Str::lower($url), '.png') ? $url : null;
                $any ??= $url;
            }

            return $pngFirst ?? $any;
        } catch (\Throwable) {
            return null;
        }
    }
}
