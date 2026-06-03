<?php

namespace App\Support\Spreadsheet;

use Illuminate\Http\UploadedFile;
use SimpleXMLElement;

class XlsxStream
{
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

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return [];
        }

        $sharedStrings = self::readSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            return [];
        }

        $sheet = new SimpleXMLElement($sheetXml);
        $sheet->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');

        $headerKeys = array_map(fn (array $col) => $col['key'], $columns);
        $headerLabels = array_map(fn (array $col) => CsvStream::normalizeHeaderPublic($col['header']), $columns);

        $rows = [];
        $headerIndexByKey = [];
        $isFirstDataRow = true;

        foreach ($sheet->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $cell) {
                $ref = (string) $cell['r'];
                $colLetters = preg_replace('/\d+/', '', $ref) ?? 'A';
                $colIndex = self::columnLettersToIndex($colLetters);
                $value = self::cellValue($cell, $sharedStrings);
                $cells[$colIndex] = trim($value);
            }

            if ($cells === []) {
                continue;
            }

            ksort($cells);
            $maxIndex = $cells === [] ? 0 : max(array_keys($cells));
            $line = [];
            for ($i = 0; $i <= $maxIndex; $i++) {
                $line[$i] = $cells[$i] ?? '';
            }

            if ($isFirstDataRow) {
                $normalized = array_map(fn ($v) => CsvStream::normalizeHeaderPublic((string) $v), $line);
                foreach ($headerLabels as $i => $label) {
                    $index = array_search($label, $normalized, true);
                    if ($index !== false) {
                        $headerIndexByKey[$headerKeys[$i]] = $index;
                    }
                }
                $isFirstDataRow = false;

                continue;
            }

            if ($headerIndexByKey === []) {
                continue;
            }

            $rowData = [];
            foreach ($headerIndexByKey as $key => $index) {
                $rowData[$key] = trim((string) ($line[$index] ?? ''));
            }

            if (self::rowHasContent($rowData)) {
                $rows[] = $rowData;
            }
        }

        return $rows;
    }

    /**
     * @return list<string>
     */
    private static function readSharedStrings(\ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $doc = new SimpleXMLElement($xml);
        $strings = [];
        foreach ($doc->si as $si) {
            if (isset($si->t)) {
                $strings[] = (string) $si->t;
            } else {
                $parts = [];
                foreach ($si->r as $run) {
                    $parts[] = (string) $run->t;
                }
                $strings[] = implode('', $parts);
            }
        }

        return $strings;
    }

    private static function cellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        $type = (string) ($cell['t'] ?? '');
        if ($type === 's') {
            $index = (int) ($cell->v ?? 0);

            return $sharedStrings[$index] ?? '';
        }

        if ($type === 'inlineStr' && isset($cell->is->t)) {
            return (string) $cell->is->t;
        }

        return (string) ($cell->v ?? '');
    }

    private static function columnLettersToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $index = 0;
        $len = strlen($letters);
        for ($i = 0; $i < $len; $i++) {
            $index = $index * 26 + (ord($letters[$i]) - 64);
        }

        return $index - 1;
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
