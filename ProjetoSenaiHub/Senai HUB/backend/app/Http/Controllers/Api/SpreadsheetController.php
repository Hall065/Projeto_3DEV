<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Spreadsheet\SpreadsheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpreadsheetController extends Controller
{
    public function __construct(
        private readonly SpreadsheetService $spreadsheets,
    ) {}

    public function index(string $module): JsonResponse
    {
        return response()->json([
            'data' => $this->spreadsheets->listModule($module),
            'module' => $module,
        ]);
    }

    public function template(string $module, string $key): StreamedResponse
    {
        return $this->spreadsheets->downloadTemplate($module, $key);
    }

    public function export(string $module, string $key, Request $request): StreamedResponse
    {
        return $this->spreadsheets->export($module, $key, $request);
    }

    public function preview(string $module, string $key, Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xlsm', 'max:10240'],
        ]);

        $result = $this->spreadsheets->preview($module, $key, $request->file('file'));

        return response()->json([
            'data' => $result,
        ]);
    }

    public function import(string $module, string $key, Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xlsm', 'max:10240'],
        ]);

        $result = $this->spreadsheets->import($module, $key, $request->file('file'), $request->user());

        return response()->json([
            'message' => 'Importacao concluida.',
            'data' => $result,
        ]);
    }

    public function logs(string $module): JsonResponse
    {
        return response()->json([
            'data' => $this->spreadsheets->importLogs($module),
        ]);
    }
}
