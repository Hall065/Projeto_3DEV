<?php

namespace App\Support\Spreadsheet;

use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class XlsxWriter
{
    /**
     * @param  list<array{name: string, headers: list<string>, rows: list<list<string>>}>  $sheets
     */
    public static function download(string $filename, array $sheets): StreamedResponse
    {
        return response()->streamDownload(function () use ($sheets): void {
            $temp = tempnam(sys_get_temp_dir(), 'hub_xlsx_');
            if ($temp === false) {
                return;
            }

            $path = $temp.'.xlsx';
            @unlink($temp);

            if (self::writeFile($path, $sheets)) {
                readfile($path);
            }

            @unlink($path);
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  list<array{name: string, headers: list<string>, rows: list<list<string>>}>  $sheets
     */
    public static function writeFile(string $path, array $sheets): bool
    {
        if ($sheets === []) {
            $sheets = [['name' => 'Relatorio', 'headers' => ['Info'], 'rows' => [['Sem dados']]]];
        }

        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return false;
        }

        $sheetXmlParts = [];
        $workbookSheets = [];

        foreach ($sheets as $index => $sheet) {
            $name = self::safeSheetName($sheet['name'] ?? ('Sheet'.($index + 1)), $index);
            $sheetPath = 'xl/worksheets/sheet'.($index + 1).'.xml';
            $sheetXmlParts[] = [$sheetPath, self::sheetXml($sheet['headers'] ?? [], $sheet['rows'] ?? [])];
            $workbookSheets[] = '<sheet name="'.self::xmlEscape($name).'" sheetId="'.($index + 1).'" r:id="rId'.($index + 2).'"/>';
        }

        $zip->addFromString('[Content_Types].xml', self::contentTypes(count($sheets)));
        $zip->addFromString('_rels/.rels', self::relsRoot());
        $zip->addFromString('xl/workbook.xml', self::workbookXml($workbookSheets));
        $zip->addFromString('xl/_rels/workbook.xml.rels', self::workbookRels(count($sheets)));
        $zip->addFromString('xl/styles.xml', self::stylesXml());

        foreach ($sheetXmlParts as [$sheetPath, $xml]) {
            $zip->addFromString($sheetPath, $xml);
        }

        $zip->close();

        return true;
    }

    /**
     * @param  list<string>  $headers
     * @param  list<list<string>>  $rows
     */
    private static function sheetXml(array $headers, array $rows): string
    {
        $allRows = $headers !== [] ? array_merge([$headers], $rows) : $rows;
        $sheetRows = '';

        foreach ($allRows as $rowIndex => $row) {
            $r = $rowIndex + 1;
            $cells = '';
            foreach ($row as $colIndex => $value) {
                $ref = self::cellRef($colIndex, $r);
                $cells .= '<c r="'.$ref.'" t="inlineStr"><is><t>'.self::xmlEscape((string) $value).'</t></is></c>';
            }
            $sheetRows .= '<row r="'.$r.'">'.$cells.'</row>';
        }

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<sheetData>'.$sheetRows.'</sheetData></worksheet>';
    }

    private static function cellRef(int $col, int $row): string
    {
        $letters = '';
        $n = $col;
        do {
            $letters = chr(65 + ($n % 26)).$letters;
            $n = intdiv($n, 26) - 1;
        } while ($n >= 0);

        return $letters.$row;
    }

    private static function contentTypes(int $sheetCount): string
    {
        $overrides = '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';

        for ($i = 1; $i <= $sheetCount; $i++) {
            $overrides .= '<Override PartName="/xl/worksheets/sheet'.$i.'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .$overrides
            .'</Types>';
    }

    private static function relsRoot(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
    }

    /**
     * @param  list<string>  $sheetTags
     */
    private static function workbookXml(array $sheetTags): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            .'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets>'.implode('', $sheetTags).'</sheets></workbook>';
    }

    private static function workbookRels(int $sheetCount): string
    {
        $rels = '';
        for ($i = 1; $i <= $sheetCount; $i++) {
            $rels .= '<Relationship Id="rId'.($i + 1).'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'.$i.'.xml"/>';
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .$rels
            .'</Relationships>';
    }

    private static function stylesXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
            .'<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
            .'<borders count="1"><border/></borders>'
            .'<cellStyleXfs count="1"><xf/></cellStyleXfs>'
            .'<cellXfs count="1"><xf xfId="0"/></cellXfs>'
            .'</styleSheet>';
    }

    private static function safeSheetName(string $name, int $index): string
    {
        $clean = preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/', '', $name) ?? 'Sheet';
        $clean = trim($clean) !== '' ? trim($clean) : 'Sheet'.($index + 1);

        return mb_substr($clean, 0, 31);
    }

    private static function xmlEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
