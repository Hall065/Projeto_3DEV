<?php

namespace App\Support\Spreadsheet;

use Illuminate\Http\UploadedFile;

class SpreadsheetFileParser
{
    /**
     * @param  list<array{key: string, header: string}>  $columns
     * @return list<array<string, string>>
     */
    public static function parse(UploadedFile $file, array $columns): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (in_array($extension, ['xlsx', 'xlsm'], true)) {
            return XlsxStream::parse($file, $columns);
        }

        return CsvStream::parse($file, $columns);
    }
}
