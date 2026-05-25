<?php

namespace App\Services;

class HealthService
{
    /**
     * @return array{status: string}
     */
    public function check(): array
    {
        return [
            'status' => 'ok',
        ];
    }
}
