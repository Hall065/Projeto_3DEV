<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class HealthService
{
    /**
     * @return array<string, mixed>
     */
    public function check(): array
    {
        $dbOk = $this->databaseIsReachable();
        $queueDriver = (string) config('queue.default', 'sync');

        return [
            'status' => $dbOk ? 'ok' : 'degraded',
            'version' => (string) config('app.version', env('APP_VERSION', 'dev')),
            'environment' => app()->environment(),
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'database' => [
                    'status' => $dbOk ? 'ok' : 'fail',
                    'connection' => config('database.default'),
                ],
                'queue' => [
                    'status' => 'ok',
                    'driver' => $queueDriver,
                    'pending_jobs' => $this->pendingQueueJobs($queueDriver),
                ],
            ],
        ];
    }

    private function databaseIsReachable(): bool
    {
        try {
            DB::connection()->getPdo();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function pendingQueueJobs(string $driver): ?int
    {
        if ($driver !== 'database') {
            return null;
        }

        try {
            return (int) DB::table('jobs')->count();
        } catch (\Throwable) {
            return null;
        }
    }
}
