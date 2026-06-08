<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectActivityResource;
use App\Http\Resources\Connect\ConnectAlertResource;
use App\Http\Resources\Connect\ConnectStudentResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectAlert;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeClasses = UserAccessScope::connectClassQuery($user)->where('status', 'active')->count();
        $totalTeachers = UserAccessScope::connectTeacherQuery($user)->where('status', 'active')->count();
        $totalStudents = UserAccessScope::connectStudentQuery($user)->where('status', 'active')->count();
        $seededStudents = UserAccessScope::connectStudentQuery($user)->count();

        $attendanceRate = $this->calculateAttendanceRate($user);

        $chartData = $this->resolveAttendanceChart();

        $recentActivities = ConnectActivity::query()
            ->orderByDesc('occurred_at')
            ->limit(8)
            ->get();

        $alerts = ConnectAlert::query()
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        $recentCadastros = UserAccessScope::connectStudentQuery($user)
            ->with(['connectClass.course', 'hubPerson'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $activeCourses = UserAccessScope::connectCourseQuery($user)->where('status', 'active')->count();
        $activeContracts = UserAccessScope::connectContractQuery($user)->where('status', 'active')->count();

        $attendanceBreakdown = $this->attendanceBreakdown($user);
        $studentsByCourse = UserAccessScope::connectCourseQuery($user)
            ->withCount('classes')
            ->get()
            ->map(fn ($course) => [
                'name' => $course->name,
                'count' => UserAccessScope::connectStudentQuery($user)
                    ->whereHas('connectClass', fn ($q) => $q->where('connect_course_id', $course->id))
                    ->count(),
            ])
            ->filter(fn ($item) => $item['count'] > 0)
            ->values();

        $weekStart = Carbon::now()->subDays(7)->toDateString();

        $classesByTeacher = UserAccessScope::connectTeacherQuery($user)
            ->with('hubPerson')
            ->withCount([
                'attendanceSessions as sessions_count' => fn ($query) => $query->whereDate('session_date', '>=', $weekStart),
            ])
            ->orderByDesc('sessions_count')
            ->limit(5)
            ->get()
            ->map(fn ($teacher) => [
                'name' => $teacher->full_name,
                'sessions' => (int) $teacher->sessions_count,
            ])
            ->filter(fn ($item) => $item['sessions'] > 0)
            ->values();

        if ($classesByTeacher->isEmpty()) {
            $classesByTeacher = UserAccessScope::connectTeacherQuery($user)
                ->with('hubPerson')
                ->withCount('attendanceSessions as sessions_count')
                ->orderByDesc('sessions_count')
                ->limit(5)
                ->get()
                ->map(fn ($teacher) => [
                    'name' => $teacher->full_name,
                    'sessions' => (int) $teacher->sessions_count,
                ])
                ->values();
        }

        $kpiTrends = $this->computeKpiTrends($attendanceRate);
        $kpiSparklines = $this->computeKpiSparklines();

        return response()->json([
            'data' => [
                'kpis' => [
                    'total_students' => $totalStudents,
                    'seeded_students' => $seededStudents,
                    'active_classes' => $activeClasses,
                    'total_teachers' => $totalTeachers,
                    'active_courses' => $activeCourses,
                    'active_contracts' => $activeContracts,
                    'attendance_rate' => $attendanceRate,
                    'pending_alerts' => ConnectAlert::query()->where('is_read', false)->count(),
                ],
                'chart' => $chartData,
                'attendance_breakdown' => $attendanceBreakdown,
                'students_by_course' => $studentsByCourse,
                'classes_by_teacher' => $classesByTeacher,
                'kpi_trends' => $kpiTrends,
                'kpi_sparklines' => $kpiSparklines,
                'recent_activities' => ConnectActivityResource::collection($recentActivities),
                'alerts' => ConnectAlertResource::collection($alerts),
                'cadastros' => ConnectStudentResource::collection($recentCadastros),
            ],
        ]);
    }

    private function calculateAttendanceRate(\App\Models\User $user): float
    {
        $totals = UserAccessScope::attendanceMarkQuery($user)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $present = (int) ($totals['present'] ?? 0) + (int) ($totals['late'] ?? 0);
        $all = array_sum($totals->all());

        if ($all === 0) {
            return 0.0;
        }

        return round(($present / $all) * 100, 1);
    }

    /**
     * @return array<string, int|float>
     */
    private function attendanceBreakdown(\App\Models\User $user): array
    {
        $totals = UserAccessScope::attendanceMarkQuery($user)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $present = (int) ($totals['present'] ?? 0) + (int) ($totals['late'] ?? 0);
        $justified = (int) ($totals['justified'] ?? 0);
        $unjustified = (int) ($totals['absent'] ?? 0);
        $all = max($present + $justified + $unjustified, 1);

        return [
            'present' => round(($present / $all) * 100, 1),
            'justified' => round(($justified / $all) * 100, 1),
            'unjustified' => round(($unjustified / $all) * 100, 1),
            'rate' => round(($present / $all) * 100, 1),
        ];
    }

    /**
     * Séries das últimas 8 semanas para mini-gráficos dos cards (total acumulado / frequência real).
     *
     * @return array<string, list<int|float>>
     */
    private function computeKpiSparklines(): array
    {
        $weeks = 8;

        return [
            'students' => $this->weeklyActiveSnapshotSeries(
                ConnectStudent::class,
                $weeks,
                fn ($query) => $query->where('status', 'active'),
            ),
            'teachers' => $this->weeklyActiveSnapshotSeries(
                ConnectTeacher::class,
                $weeks,
                fn ($query) => $query->where('status', 'active'),
            ),
            'classes' => $this->weeklyActiveSnapshotSeries(
                ConnectClass::class,
                $weeks,
                fn ($query) => $query->where('status', 'active'),
            ),
            'courses' => $this->weeklyActiveSnapshotSeries(
                ConnectCourse::class,
                $weeks,
                fn ($query) => $query->where('status', 'active'),
            ),
            'contracts' => $this->weeklyActiveSnapshotSeries(
                ConnectContract::class,
                $weeks,
                fn ($query) => $query->where('status', 'active'),
            ),
            'attendance' => $this->attendanceWeeklyRateSeries($weeks),
        ];
    }

    /**
     * Total acumulado de registros ativos ao fim de cada semana (alinhado ao KPI do card).
     *
     * @param  class-string  $model
     * @param  callable(\Illuminate\Database\Eloquent\Builder): void|null  $scope
     * @return list<int>
     */
    private function weeklyActiveSnapshotSeries(string $model, int $weeks, ?callable $scope = null): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $end = Carbon::now()->subWeeks($w)->endOfWeek();

            $query = $model::query()->where('created_at', '<=', $end);

            if ($scope !== null) {
                $scope($query);
            }

            $points[] = (int) $query->count();
        }

        return $points;
    }

    /**
     * @return list<float>
     */
    private function attendanceWeeklyRateSeries(int $weeks): array
    {
        $points = [];

        for ($w = $weeks - 1; $w >= 0; $w--) {
            $start = Carbon::now()->subWeeks($w)->startOfWeek();
            $end = Carbon::now()->subWeeks($w)->endOfWeek();
            $rate = $this->attendanceRateForPeriod($start, $end);
            $points[] = $rate;
        }

        return $points;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function computeKpiTrends(float $currentAttendanceRate): array
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        return [
            'students' => $this->growthTrend(
                ConnectStudent::query()->where('created_at', '>=', $thisMonthStart)->count(),
                ConnectStudent::query()->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count(),
                'novos este mes',
            ),
            'teachers' => $this->growthTrend(
                ConnectTeacher::query()->where('created_at', '>=', $thisMonthStart)->count(),
                ConnectTeacher::query()->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count(),
                'vs. mes anterior',
            ),
            'classes' => $this->growthTrend(
                ConnectClass::query()->where('created_at', '>=', $thisMonthStart)->count(),
                ConnectClass::query()->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count(),
                'novas turmas',
            ),
            'courses' => $this->growthTrend(
                ConnectCourse::query()->where('created_at', '>=', $thisMonthStart)->count(),
                ConnectCourse::query()->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count(),
                'vs. mes anterior',
            ),
            'attendance' => $this->attendanceTrend($currentAttendanceRate, $thisMonthStart, $lastMonthStart, $lastMonthEnd),
            'contracts' => $this->growthTrend(
                ConnectContract::query()->where('created_at', '>=', $thisMonthStart)->count(),
                ConnectContract::query()->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count(),
                'novos contratos',
            ),
        ];
    }

    /**
     * @return array{direction: string, value: string, label: string}
     */
    private function growthTrend(int $current, int $previous, string $label): array
    {
        if ($previous === 0) {
            return [
                'direction' => $current > 0 ? 'up' : 'neutral',
                'value' => (string) $current,
                'label' => $label,
            ];
        }

        $pct = round((($current - $previous) / $previous) * 100, 1);

        return [
            'direction' => $pct > 0 ? 'up' : ($pct < 0 ? 'down' : 'neutral'),
            'value' => number_format(abs($pct), 1, ',', '.').'%',
            'label' => $label,
        ];
    }

    /**
     * @return array{direction: string, value: string, label: string}
     */
    private function attendanceTrend(float $currentRate, Carbon $thisMonthStart, Carbon $lastMonthStart, Carbon $lastMonthEnd): array
    {
        $lastRate = $this->attendanceRateForPeriod($lastMonthStart, $lastMonthEnd);
        $diff = round($currentRate - $lastRate, 1);

        return [
            'direction' => $diff > 0 ? 'up' : ($diff < 0 ? 'down' : 'neutral'),
            'value' => number_format(abs($diff), 1, ',', '.').'%',
            'label' => 'vs. mes anterior',
        ];
    }

    private function attendanceRateForPeriod(Carbon $from, Carbon $to): float
    {
        $sessionIds = ConnectAttendanceSession::query()
            ->whereBetween('session_date', [$from->toDateString(), $to->toDateString()])
            ->pluck('id');

        if ($sessionIds->isEmpty()) {
            return 0.0;
        }

        $totals = ConnectAttendanceMark::query()
            ->whereIn('connect_attendance_session_id', $sessionIds)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $present = (int) ($totals['present'] ?? 0) + (int) ($totals['late'] ?? 0);
        $all = array_sum($totals->all());

        if ($all === 0) {
            return 0.0;
        }

        return round(($present / $all) * 100, 1);
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveAttendanceChart(): array
    {
        return $this->buildAttendanceChartFromDb();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAttendanceChartFromDb(): array
    {
        $monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        $labels = [];
        $attendanceRates = [];
        $enrollments = [];

        for ($m = 5; $m >= 0; $m--) {
            $start = Carbon::now()->subMonths($m)->startOfMonth();
            $end = Carbon::now()->subMonths($m)->endOfMonth();
            $labels[] = $monthsPt[$start->month - 1];
            $attendanceRates[] = $this->attendanceRateForPeriod($start, $end);
            $enrollments[] = ConnectStudent::query()
                ->whereBetween('created_at', [$start, $end])
                ->count();
        }

        return [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Frequência (%)',
                    'data' => $attendanceRates,
                ],
                [
                    'label' => 'Matrículas',
                    'data' => $enrollments,
                ],
            ],
        ];
    }
}
