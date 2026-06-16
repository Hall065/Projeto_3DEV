<?php

namespace App\Http\Controllers\Api\Safe;

use App\Http\Controllers\Controller;
use App\Http\Resources\Safe\SafeStudentResource;
use App\Models\Safe\SafeStudent;
use App\Services\Safe\SafeConnectStudentBridge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    public function __construct(
        private readonly SafeConnectStudentBridge $bridge,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $students = $this->bridge->paginate($request);

        return SafeStudentResource::collection($students)->response();
    }

    public function show(SafeStudent $safeStudent): JsonResponse
    {
        $safeStudent->load(['connectStudent.connectClass'])->loadCount('authorizations');

        if ($safeStudent->connectStudent) {
            $safeStudent = $this->bridge->ensureSafeStudentRecord($safeStudent->connectStudent);
            $safeStudent->loadCount('authorizations');
        }

        return response()->json([
            'data' => new SafeStudentResource($safeStudent),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        throw ValidationException::withMessages([
            'registration' => 'Cadastre e edite alunos no modulo SENAI Connect. O SAFE usa a mesma base de alunos.',
        ]);
    }

    public function update(Request $request, SafeStudent $safeStudent): JsonResponse
    {
        throw ValidationException::withMessages([
            'name' => 'Edite os dados do aluno no modulo SENAI Connect. O SAFE usa a mesma base de alunos.',
        ]);
    }

    public function destroy(SafeStudent $safeStudent): JsonResponse
    {
        throw ValidationException::withMessages([
            'id' => 'Remova alunos pelo modulo SENAI Connect. O SAFE mantem apenas o vinculo para autorizacoes.',
        ]);
    }
}
