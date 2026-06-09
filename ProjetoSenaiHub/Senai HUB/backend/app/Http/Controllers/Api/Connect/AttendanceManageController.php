<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectAttendanceSessionResource;
use App\Models\Connect\ConnectAttendanceSession;
use App\Services\Connect\ConnectAttendanceService;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceManageController extends Controller
{
    public function __construct(
        private readonly ConnectAttendanceService $attendance,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $scopedClassIds = UserAccessScope::connectClassQuery($request->user())->select('id');

        $query = ConnectAttendanceSession::query()
            ->whereIn('connect_class_id', $scopedClassIds)
            ->with(['connectClass.course', 'teacher.hubPerson', 'connectClass.teacher.hubPerson', 'marks.student.hubPerson'])
            ->withCount('marks')
            ->orderByDesc('session_date');

        if ($request->filled('connect_class_id')) {
            $query->where('connect_class_id', $request->integer('connect_class_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('from_date')) {
            $query->whereDate('session_date', '>=', $request->string('from_date')->toString());
        }

        if ($request->filled('to_date')) {
            $query->whereDate('session_date', '<=', $request->string('to_date')->toString());
        }

        $sessions = $query->paginate($request->integer('per_page', 15));

        return ConnectAttendanceSessionResource::collection($sessions)->response();
    }

    public function classSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_class_id' => ['required', 'exists:connect_classes,id'],
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
        ]);

        $class = UserAccessScope::connectClassQuery($request->user())
            ->withCount('students')
            ->findOrFail($validated['connect_class_id']);

        return response()->json([
            'data' => $this->attendance->classSummary(
                $class,
                $validated['from_date'] ?? null,
                $validated['to_date'] ?? null,
            ),
        ]);
    }

    public function studentSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_class_id' => ['required', 'exists:connect_classes,id'],
            'connect_student_id' => ['required', 'exists:connect_students,id'],
        ]);

        $class = UserAccessScope::connectClassQuery($request->user())
            ->findOrFail($validated['connect_class_id']);

        $student = UserAccessScope::connectStudentQuery($request->user())
            ->where('connect_class_id', $class->id)
            ->findOrFail($validated['connect_student_id']);

        return response()->json([
            'data' => $this->attendance->studentSummary($student, $class),
        ]);
    }
}
