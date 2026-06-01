<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectStudentResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectStudent;
use App\Models\HubPerson;
use App\Services\Connect\ConnectEnrollmentService;
use App\Support\ConnectForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function __construct(
        private readonly ConnectEnrollmentService $enrollment,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = \App\Support\UserAccessScope::connectStudentQuery($request->user())
            ->with(['connectClass.course', 'location', 'hubPerson'])
            ->orderBy('full_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->whereProfileMatches($search, ['full_name', 'email', 'registration_number', 'cpf']);
        }

        if ($request->filled('connect_class_id')) {
            $query->where('connect_class_id', $request->integer('connect_class_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $students = $query->paginate($request->integer('per_page', 15));

        return ConnectStudentResource::collection($students)->response();
    }

    public function store(Request $request): JsonResponse
    {
        ConnectForm::mergeNullableForeignIds($request, ['connect_class_id']);

        $validated = $request->validate([
            'connect_class_id' => ['nullable', 'exists:connect_classes,id'],
            'full_name' => ['required', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'registration_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $student = DB::transaction(function () use ($validated, $request) {
            $person = HubPerson::query()->create([
                'kind' => 'student',
                'user_id' => $validated['user_id'] ?? null,
                'full_name' => $validated['full_name'],
                'cpf' => $validated['cpf'] ?? null,
                'registration_number' => $validated['registration_number'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'specialty' => null,
                'status' => $validated['status'] ?? 'active',
            ]);

            $student = ConnectStudent::query()->create([
                'hub_person_id' => $person->id,
                'user_id' => $validated['user_id'] ?? null,
                'connect_class_id' => $validated['connect_class_id'] ?? null,
                'full_name' => $validated['full_name'],
                'cpf' => $validated['cpf'] ?? null,
                'registration_number' => $validated['registration_number'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ]);

            $this->enrollment->syncPivotsForStudent($student);

            return $student;
        });

        ConnectActivity::query()->create([
            'title' => 'Novo aluno cadastrado',
            'description' => "Cadastro de {$student->full_name} realizado no SENAI Connect.",
            'type' => 'cadastro',
            'entity_type' => 'student',
            'entity_id' => $student->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $student->load(['connectClass.course', 'location', 'hubPerson']);

        return response()->json([
            'data' => new ConnectStudentResource($student),
            'message' => 'Aluno cadastrado com sucesso.',
        ], 201);
    }

    public function update(Request $request, ConnectStudent $student): JsonResponse
    {
        ConnectForm::mergeNullableForeignIds($request, ['connect_class_id']);

        $validated = $request->validate([
            'connect_class_id' => ['nullable', 'exists:connect_classes,id'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'cpf' => ['nullable', 'string', 'max:14'],
            'registration_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'graduated'])],
        ]);

        DB::transaction(function () use ($validated, $student): void {
            $profileFields = collect($validated)->only([
                'full_name', 'cpf', 'registration_number', 'email', 'phone', 'birth_date', 'status',
            ])->filter(fn ($v) => $v !== null)->all();

            if ($student->hubPerson && $profileFields !== []) {
                $student->hubPerson->update($profileFields);
            }

            $student->update($validated);
            $this->enrollment->syncPivotsForStudent($student->fresh());
        });

        $student->load(['connectClass.course', 'location', 'hubPerson']);

        return response()->json([
            'data' => new ConnectStudentResource($student),
            'message' => 'Aluno atualizado com sucesso.',
        ]);
    }

    public function destroy(ConnectStudent $student): JsonResponse
    {
        DB::transaction(function () use ($student): void {
            $personId = $student->hub_person_id;
            $student->delete();
            if ($personId) {
                HubPerson::query()->whereKey($personId)->delete();
            }
        });

        return response()->json(['message' => 'Aluno excluído com sucesso.']);
    }
}
