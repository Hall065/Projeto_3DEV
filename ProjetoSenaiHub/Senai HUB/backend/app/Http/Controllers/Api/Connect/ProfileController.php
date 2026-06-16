<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectClassResource;
use App\Http\Resources\Connect\ConnectContractResource;
use App\Http\Resources\Connect\ConnectCourseResource;
use App\Http\Resources\Connect\ConnectSalaryRecordResource;
use App\Http\Resources\Connect\ConnectStudentResource;
use App\Http\Resources\Connect\ConnectTeacherResource;
use App\Http\Resources\HubPersonResource;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectSalaryRecord;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Models\HubPerson;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function student(ConnectStudent $student): JsonResponse
    {
        $student->load(['connectClass.course', 'connectClass.teacher', 'hubPerson', 'location']);

        $contracts = ConnectContract::query()
            ->with('student')
            ->where('connect_student_id', $student->id)
            ->orderByDesc('start_date')
            ->get();

        $salaries = ConnectSalaryRecord::query()
            ->with('student')
            ->where('connect_student_id', $student->id)
            ->orderByDesc('reference_month')
            ->limit(12)
            ->get();

        $coursesActive = [];
        $coursesCompleted = [];

        if ($student->hubPerson) {
            $enrollments = $student->hubPerson
                ->courses()
                ->with('classes')
                ->get();

            foreach ($enrollments as $course) {
                $pivotStatus = $course->pivot->status ?? 'active';
                $item = [
                    'course_id' => $course->id,
                    'course' => new ConnectCourseResource($course),
                    'role' => $course->pivot->role,
                    'enrolled_at' => $course->pivot->enrolled_at,
                    'status' => $pivotStatus,
                ];

                if (in_array($pivotStatus, ['finished', 'inactive', 'completed'], true) || $student->status === 'graduated') {
                    $coursesCompleted[] = $item;
                } else {
                    $coursesActive[] = $item;
                }
            }
        }

        if ($student->connectClass?->course) {
            $currentId = $student->connectClass->course->id;
            $already = collect($coursesActive)->contains(fn ($row) => ($row['course_id'] ?? null) === $currentId);
            if (! $already) {
                array_unshift($coursesActive, [
                    'course_id' => $currentId,
                    'course' => new ConnectCourseResource($student->connectClass->course),
                    'role' => 'student',
                    'enrolled_at' => $student->connectClass->start_date?->format('Y-m-d'),
                    'status' => 'active',
                    'via_class' => $student->connectClass->name,
                ]);
            }
        }

        $classesHistory = ConnectClass::query()
            ->where(function ($query) use ($student): void {
                if ($student->hub_person_id) {
                    $query->whereHas(
                        'enrolledPeople',
                        fn ($q) => $q->where('hub_people.id', $student->hub_person_id)
                    );
                }
                if ($student->connect_class_id) {
                    $query->orWhere('id', $student->connect_class_id);
                }
            })
            ->with(['course', 'teacher'])
            ->orderByDesc('start_date')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'student' => new ConnectStudentResource($student),
                'contracts' => ConnectContractResource::collection($contracts),
                'salaries' => ConnectSalaryRecordResource::collection($salaries),
                'courses_active' => $coursesActive,
                'courses_completed' => $coursesCompleted,
                'classes' => ConnectClassResource::collection($classesHistory),
            ],
        ]);
    }

    public function teacher(ConnectTeacher $teacher): JsonResponse
    {
        $teacher->load('hubPerson');

        $classes = ConnectClass::query()
            ->with(['course'])
            ->where('connect_teacher_id', $teacher->id)
            ->withCount('students')
            ->orderBy('name')
            ->get();

        $coursesTeaching = [];
        if ($teacher->hubPerson) {
            $coursesTeaching = $teacher->hubPerson
                ->courses()
                ->wherePivot('role', 'teacher')
                ->get()
                ->map(fn ($course) => [
                    'course' => new ConnectCourseResource($course),
                    'status' => $course->pivot->status,
                    'enrolled_at' => $course->pivot->enrolled_at,
                ])
                ->values()
                ->all();
        }

        return response()->json([
            'data' => [
                'teacher' => new ConnectTeacherResource($teacher),
                'classes' => ConnectClassResource::collection($classes),
                'courses' => $coursesTeaching,
            ],
        ]);
    }

    public function classProfile(ConnectClass $connectClass): JsonResponse
    {
        $connectClass->load(['course', 'teacher.hubPerson']);
        $connectClass->loadCount('students');

        $students = ConnectStudent::query()
            ->with(['hubPerson'])
            ->where('connect_class_id', $connectClass->id)
            ->orderBy('full_name')
            ->get();

        return response()->json([
            'data' => [
                'class' => new ConnectClassResource($connectClass),
                'students' => ConnectStudentResource::collection($students),
            ],
        ]);
    }

    public function course(ConnectCourse $course): JsonResponse
    {
        $course->loadCount('classes');

        $classes = ConnectClass::query()
            ->with(['teacher'])
            ->where('connect_course_id', $course->id)
            ->withCount('students')
            ->orderBy('name')
            ->get();

        $people = $course->people()->get();
        $students = $people->where('pivot.role', 'student')->values();
        $teachers = $people->where('pivot.role', 'teacher')->values();
        $coordinators = $people->where('pivot.role', 'coordinator')->values();

        return response()->json([
            'data' => [
                'course' => new ConnectCourseResource($course),
                'classes' => ConnectClassResource::collection($classes),
                'roster' => [
                    'students' => HubPersonResource::collection($students),
                    'teachers' => HubPersonResource::collection($teachers),
                    'coordinators' => HubPersonResource::collection($coordinators),
                ],
            ],
        ]);
    }

    public function person(HubPerson $person): JsonResponse
    {
        $person->load(['connectStudent.connectClass.course', 'connectTeacher']);

        return response()->json([
            'data' => [
                'person' => new HubPersonResource($person),
                'connect_student' => $person->connectStudent
                    ? new ConnectStudentResource($person->connectStudent)
                    : null,
                'connect_teacher' => $person->connectTeacher
                    ? new ConnectTeacherResource($person->connectTeacher)
                    : null,
                'courses' => HubPersonResource::collection($person->courses()->get()),
            ],
        ]);
    }

    public function contract(ConnectContract $contract): JsonResponse
    {
        $contract->load(['student.connectClass.course', 'student.hubPerson', 'attachments']);

        return response()->json([
            'data' => [
                'contract' => new ConnectContractResource($contract),
            ],
        ]);
    }
}
