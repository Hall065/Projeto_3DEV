<?php

namespace App\Services\Safe;

use App\Models\Connect\ConnectStudent;
use App\Models\Safe\SafeStudent;
use App\Models\User;
use App\Support\UserAccessScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class SafeConnectStudentBridge
{
    public function paginate(Request $request, ?User $user = null): LengthAwarePaginator
    {
        $user = $user ?? $request->user();
        $search = trim((string) $request->query('search', $request->query('q', '')));

        $query = UserAccessScope::connectStudentQuery($user)
            ->with(['connectClass'])
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($inner) use ($search): void {
                    $inner->where('full_name', 'like', '%'.$search.'%')
                        ->orWhere('registration_number', 'like', '%'.$search.'%')
                        ->orWhereHas('connectClass', fn ($class) => $class
                            ->where('name', 'like', '%'.$search.'%')
                            ->orWhere('code', 'like', '%'.$search.'%'));
                });
            })
            ->when($request->filled('active'), function ($builder) use ($request): void {
                $builder->where('status', $request->boolean('active') ? 'active' : 'inactive');
            })
            ->when($request->filled('class_name'), function ($builder) use ($request): void {
                $className = $request->string('class_name')->toString();
                $builder->whereHas('connectClass', fn ($class) => $class
                    ->where('name', 'like', '%'.$className.'%')
                    ->orWhere('code', 'like', '%'.$className.'%'));
            })
            ->orderBy('full_name');

        $paginator = $query->paginate($request->integer('per_page', 15));

        $paginator->setCollection(
            $paginator->getCollection()->map(fn (ConnectStudent $student) => $this->ensureSafeStudentRecord($student))
        );

        return $paginator;
    }

    public function ensureSafeStudentRecord(ConnectStudent $connectStudent): SafeStudent
    {
        $connectStudent->loadMissing('connectClass');

        $registration = $connectStudent->registration_number ?? (string) $connectStudent->id;

        $existing = SafeStudent::query()
            ->where('connect_student_id', $connectStudent->id)
            ->orWhere('registration', $registration)
            ->first();

        $payload = [
            'connect_student_id' => $connectStudent->id,
            'registration' => $registration,
            'name' => $connectStudent->full_name,
            'class_name' => $connectStudent->connectClass?->name
                ?? $connectStudent->connectClass?->code
                ?? 'Sem turma',
            'active' => $connectStudent->status === 'active',
        ];

        if ($existing) {
            $existing->update($payload);

            return $existing->fresh();
        }

        return SafeStudent::query()->create($payload);
    }

    public function resolveSafeStudent(?int $safeStudentId, ?int $connectStudentId): ?SafeStudent
    {
        if ($connectStudentId) {
            $connectStudent = ConnectStudent::query()->with('connectClass')->findOrFail($connectStudentId);

            return $this->ensureSafeStudentRecord($connectStudent);
        }

        if ($safeStudentId) {
            $student = SafeStudent::query()->with('connectStudent.connectClass')->findOrFail($safeStudentId);

            if ($student->connectStudent) {
                return $this->ensureSafeStudentRecord($student->connectStudent);
            }

            return $student;
        }

        return null;
    }
}
