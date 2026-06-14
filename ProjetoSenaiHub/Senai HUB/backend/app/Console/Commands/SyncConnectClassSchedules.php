<?php

namespace App\Console\Commands;

use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Services\Connect\ConnectScheduleService;
use App\Support\ConnectWeeklyPatternDefaults;
use Illuminate\Console\Command;

class SyncConnectClassSchedules extends Command
{
    protected $signature = 'connect:sync-class-schedules {--replace-future : Remove future scheduled lessons before regenerating}';

    protected $description = 'Create weekly patterns and calendar lessons for classes missing schedules';

    public function handle(ConnectScheduleService $schedule): int
    {
        $replaceFuture = (bool) $this->option('replace-future');
        $processed = 0;
        $lessonsCreated = 0;

        ConnectClass::query()
            ->where('status', 'active')
            ->orderBy('id')
            ->each(function (ConnectClass $class) use ($schedule, $replaceFuture, &$processed, &$lessonsCreated): void {
                if (! $class->start_date || ! $class->end_date) {
                    $this->warn("Turma #{$class->id} ({$class->name}): sem periodo definido, ignorada.");

                    return;
                }

                $periodAdjusted = $this->alignClassPeriodIfPast($class);

                if ($class->weeklyPatterns()->doesntExist()) {
                    $schedule->syncWeeklyPatterns(
                        $class,
                        ConnectWeeklyPatternDefaults::forShift((string) $class->shift),
                    );
                }

                if ($replaceFuture || $periodAdjusted) {
                    $this->purgeRegenerableLessons($class);
                } elseif ($class->lessonSchedules()->where('status', '!=', 'cancelled')->exists()) {
                    $this->line("Turma #{$class->id} ({$class->name}): ja possui aulas, ignorada.");

                    return;
                }

                $result = $schedule->generateFromPatterns(
                    $class->fresh(['course', 'weeklyPatterns']),
                    $replaceFuture,
                );

                $processed++;
                $lessonsCreated += (int) ($result['created'] ?? 0);

                $this->info("Turma #{$class->id} ({$class->name}): {$result['created']} aula(s) criada(s).");
            });

        $this->info("Concluido: {$processed} turma(s), {$lessonsCreated} aula(s) no calendario.");

        return self::SUCCESS;
    }

    private function alignClassPeriodIfPast(ConnectClass $class): bool
    {
        if (! $class->end_date || ! $class->start_date) {
            return false;
        }

        if ($class->end_date->gte(now()->startOfDay())) {
            return false;
        }

        $year = now()->year;
        $start = $class->start_date->copy()->setYear($year);
        $end = $class->end_date->copy()->setYear($year);

        if ($end->lt($start)) {
            $end = $end->addYear();
        }

        $class->update([
            'start_date' => $start,
            'end_date' => $end,
        ]);

        $class->refresh();

        return true;
    }

    private function purgeRegenerableLessons(ConnectClass $class): void
    {
        $lessonIds = $class->lessonSchedules()
            ->where('status', 'scheduled')
            ->whereDoesntHave('attendanceSession', fn ($query) => $query->where('status', 'closed'))
            ->pluck('id');

        if ($lessonIds->isNotEmpty()) {
            ConnectAttendanceSession::query()
                ->whereIn('connect_lesson_schedule_id', $lessonIds)
                ->where('status', 'open')
                ->delete();

            $class->lessonSchedules()->whereIn('id', $lessonIds)->delete();
        }

        ConnectAttendanceSession::query()
            ->where('connect_class_id', $class->id)
            ->where('status', 'open')
            ->whereNull('connect_lesson_schedule_id')
            ->delete();
    }
}
