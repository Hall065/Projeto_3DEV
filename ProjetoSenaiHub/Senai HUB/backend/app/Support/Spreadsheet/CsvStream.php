<?php

namespace App\Support\Spreadsheet;

use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CsvStream
{
    /**
     * @param  list<array{key: string, header: string}>  $columns
     * @param  iterable<int, array<string, string|null>>  $rows
     */
    public static function download(string $filename, array $columns, iterable $rows): StreamedResponse
    {
        $headers = array_map(fn (array $col) => $col['header'], $columns);
        $keys = array_map(fn (array $col) => $col['key'], $columns);

        return response()->streamDownload(function () use ($headers, $keys, $rows): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers, ';');

            foreach ($rows as $row) {
                $line = [];
                foreach ($keys as $key) {
                    $line[] = $row[$key] ?? '';
                }
                fputcsv($handle, $line, ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  list<array{key: string, header: string}>  $columns
     * @return list<array<string, string>>
     */
    public static function parse(UploadedFile $file, array $columns): array
    {
        $path = $file->getRealPath();
        if ($path === false) {
            return [];
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            return [];
        }

        $headerLine = fgetcsv($handle, 0, ';');
        if ($headerLine === false) {
            $headerLine = fgetcsv($handle, 0, ',');
            rewind($handle);
            $headerLine = fgetcsv($handle, 0, ',');
        }

        if ($headerLine === false) {
            fclose($handle);

            return [];
        }

        $headerLine = array_map(fn ($cell) => self::normalizeHeader((string) $cell), $headerLine);
        $delimiter = str_contains(implode('', $headerLine), ';') ? ';' : ',';
        rewind($handle);
        $headerLine = fgetcsv($handle, 0, $delimiter);
        if ($headerLine === false) {
            fclose($handle);

            return [];
        }

        $headerLine = array_map(fn ($cell) => self::normalizeHeader((string) $cell), $headerLine);

        $indexByKey = [];
        foreach ($columns as $column) {
            $normalizedHeader = self::normalizeHeader($column['header']);
            $index = array_search($normalizedHeader, $headerLine, true);
            if ($index !== false) {
                $indexByKey[$column['key']] = $index;
            }
        }

        $rows = [];
        while (($line = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($line === [null] || self::isEmptyLine($line)) {
                continue;
            }

            $row = [];
            foreach ($indexByKey as $key => $index) {
                $row[$key] = trim((string) ($line[$index] ?? ''));
            }

            if (self::rowHasContent($row)) {
                $rows[] = $row;
            }
        }

        fclose($handle);

        return $rows;
    }

    public static function normalizeHeaderPublic(string $value): string
    {
        return self::normalizeHeader($value);
    }

    private static function normalizeHeader(string $value): string
    {
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;

        return mb_strtolower(trim($value));
    }

    /**
     * @param  array<int, string|null>  $line
     */
    private static function isEmptyLine(array $line): bool
    {
        foreach ($line as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, string>  $row
     */
    private static function rowHasContent(array $row): bool
    {
        foreach ($row as $value) {
            if ($value !== '') {
                return true;
            }
        }

        return false;
    }
}
